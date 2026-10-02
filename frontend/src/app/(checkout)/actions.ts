"use server";

import { after } from "next/server";
import {
	AddressValidationRulesDocument,
	CheckoutAddPromoCodeDocument,
	CheckoutBillingAddressUpdateDocument,
	CheckoutCompleteDocument,
	CheckoutCreateDocument,
	CheckoutCustomerAttachDocument,
	CheckoutDeliveryMethodUpdateDocument,
	CheckoutEmailUpdateDocument,
	CheckoutMetadataUpdateDocument,
	CheckoutLinesDeleteDocument,
	CheckoutLinesAddDocument,
	CheckoutRemovePromoCodeDocument,
	CheckoutShippingAddressUpdateDocument,
	DeliveryOptionsCalculateDocument,
	RequestPasswordResetDocument,
	PaymentGatewaysInitializeDocument,
	TransactionCreateDocument,
	TransactionInitializeDocument,
	TransactionProcessDocument,
	UserSetDefaultAddressDocument,
	type AddressValidationRulesQuery,
	type AddressValidationRulesQueryVariables,
	type CheckoutAddPromoCodeMutation,
	type CheckoutAddPromoCodeMutationVariables,
	type CheckoutBillingAddressUpdateMutation,
	type CheckoutBillingAddressUpdateMutationVariables,
	type CheckoutCompleteMutation,
	type CheckoutCompleteMutationVariables,
	type CheckoutCreateMutation,
	type CheckoutCreateMutationVariables,
	type CheckoutCustomerAttachMutation,
	type CheckoutCustomerAttachMutationVariables,
	type CheckoutDeliveryMethodUpdateMutation,
	type CheckoutDeliveryMethodUpdateMutationVariables,
	type CheckoutEmailUpdateMutation,
	type CheckoutEmailUpdateMutationVariables,
	type CheckoutMetadataUpdateMutation,
	type CheckoutMetadataUpdateMutationVariables,
	type CheckoutLinesDeleteMutation,
	type CheckoutLinesDeleteMutationVariables,
	type CheckoutLinesAddMutation,
	type CheckoutLinesAddMutationVariables,
	type CheckoutRemovePromoCodeMutation,
	type CheckoutRemovePromoCodeMutationVariables,
	type CheckoutShippingAddressUpdateMutation,
	type CheckoutShippingAddressUpdateMutationVariables,
	type DeliveryOptionsCalculateMutation,
	type DeliveryOptionsCalculateMutationVariables,
	type RequestPasswordResetMutation,
	type RequestPasswordResetMutationVariables,
	type PaymentGatewaysInitializeMutation,
	type PaymentGatewaysInitializeMutationVariables,
	type TransactionCreateMutation,
	type TransactionCreateMutationVariables,
	type TransactionInitializeMutation,
	type TransactionInitializeMutationVariables,
	type TransactionProcessMutation,
	type TransactionProcessMutationVariables,
	type UserSetDefaultAddressMutation,
	type UserSetDefaultAddressMutationVariables,
	type AddressInput,
	type AddressTypeEnum,
	type CountryCode,
} from "@/checkout/graphql/generated/operations";
import type {
	AddressValidationRulesActionResult,
	CheckoutActionResult,
	CheckoutCompleteActionResult,
	CheckoutFieldError,
	DeliveryOptionsActionResult,
	PaymentGatewaysInitializeActionResult,
	SimpleActionResult,
	TransactionInitializeActionResult,
	TransactionProcessActionResult,
} from "@/checkout/lib/checkout-action-types";
import type { CheckoutFetchResult } from "@/checkout/lib/checkout-types";
import { getDummyPaymentGuardError, isDummyGateway, isDummyPaymentAllowed } from "@/checkout/lib/payment-gateways";
import {
	getCheckoutPayAmount,
	hasMaterialCheckoutTotalChange,
} from "@/checkout/lib/payment/checkout-pay-amount";
import { getStripePaymentGuardError, isStripePaymentEnabled } from "@/checkout/lib/payment/providers/stripe";
import { buildMarketingConsentMetadata } from "@/checkout/lib/marketing-consent";
import { enrichCheckoutCommerceContext } from "@/checkout/lib/server/enrich-commerce-context";
import { fetchCheckoutOnServer } from "@/checkout/lib/server/fetch-checkout";
import { getCheckoutServerTranslations } from "@/checkout/lib/server/get-checkout-server-translations";
import { toCheckoutActionResult } from "@/checkout/lib/server/mutation-result";
import { toTypedDocument } from "@/checkout/lib/server/to-typed-document";
import { checkoutGraphqlLanguageCode, resolveCheckoutLocaleSlug } from "@/lib/checkout-locale";
import { emitCommerceEvent } from "@/lib/analytics/emit.server";
import { checkoutCreateContextMetadata } from "@/lib/commerce-context/checkout-create-context";
import { graphqlLanguageCodeVariables } from "@/lib/graphql-locale";
import { isAllowedRedirectUrl } from "@/lib/auth/validate-redirect-url";
import { executeAppGraphQL, executeAuthenticatedGraphQL, executePublicGraphQL, executeRawGraphQL } from "@/lib/graphql";
import * as Checkout from "@/lib/checkout";
import { saveCheckoutId } from "@/app/actions";
import { setOrderViewCookie, signOrderViewToken } from "@/lib/order-view";

const checkoutEmailUpdateDocument = toTypedDocument<
	CheckoutEmailUpdateMutation,
	CheckoutEmailUpdateMutationVariables
>(CheckoutEmailUpdateDocument);

const checkoutMetadataUpdateDocument = toTypedDocument<
	CheckoutMetadataUpdateMutation,
	CheckoutMetadataUpdateMutationVariables
>(CheckoutMetadataUpdateDocument);

const checkoutShippingAddressUpdateDocument = toTypedDocument<
	CheckoutShippingAddressUpdateMutation,
	CheckoutShippingAddressUpdateMutationVariables
>(CheckoutShippingAddressUpdateDocument);

const checkoutCustomerAttachDocument = toTypedDocument<
	CheckoutCustomerAttachMutation,
	CheckoutCustomerAttachMutationVariables
>(CheckoutCustomerAttachDocument);

const checkoutCreateDocument = toTypedDocument<CheckoutCreateMutation, CheckoutCreateMutationVariables>(
	CheckoutCreateDocument,
);

const checkoutLinesAddDocument = toTypedDocument<CheckoutLinesAddMutation, CheckoutLinesAddMutationVariables>(
	CheckoutLinesAddDocument,
);

const checkoutLinesDeleteDocument = toTypedDocument<
	CheckoutLinesDeleteMutation,
	CheckoutLinesDeleteMutationVariables
>(CheckoutLinesDeleteDocument);

const checkoutDeliveryMethodUpdateDocument = toTypedDocument<
	CheckoutDeliveryMethodUpdateMutation,
	CheckoutDeliveryMethodUpdateMutationVariables
>(CheckoutDeliveryMethodUpdateDocument);

const deliveryOptionsCalculateDocument = toTypedDocument<
	DeliveryOptionsCalculateMutation,
	DeliveryOptionsCalculateMutationVariables
>(DeliveryOptionsCalculateDocument);

const checkoutBillingAddressUpdateDocument = toTypedDocument<
	CheckoutBillingAddressUpdateMutation,
	CheckoutBillingAddressUpdateMutationVariables
>(CheckoutBillingAddressUpdateDocument);

const paymentGatewaysInitializeDocument = toTypedDocument<
	PaymentGatewaysInitializeMutation,
	PaymentGatewaysInitializeMutationVariables
>(PaymentGatewaysInitializeDocument);

const transactionInitializeDocument = toTypedDocument<
	TransactionInitializeMutation,
	TransactionInitializeMutationVariables
>(TransactionInitializeDocument);

const transactionCreateDocument = toTypedDocument<
	TransactionCreateMutation,
	TransactionCreateMutationVariables
>(TransactionCreateDocument);

const transactionProcessDocument = toTypedDocument<
	TransactionProcessMutation,
	TransactionProcessMutationVariables
>(TransactionProcessDocument);

const checkoutCompleteDocument = toTypedDocument<CheckoutCompleteMutation, CheckoutCompleteMutationVariables>(
	CheckoutCompleteDocument,
);

const addressValidationRulesDocument = toTypedDocument<
	AddressValidationRulesQuery,
	AddressValidationRulesQueryVariables
>(AddressValidationRulesDocument);

const checkoutAddPromoCodeDocument = toTypedDocument<
	CheckoutAddPromoCodeMutation,
	CheckoutAddPromoCodeMutationVariables
>(CheckoutAddPromoCodeDocument);

const checkoutRemovePromoCodeDocument = toTypedDocument<
	CheckoutRemovePromoCodeMutation,
	CheckoutRemovePromoCodeMutationVariables
>(CheckoutRemovePromoCodeDocument);

const requestPasswordResetDocument = toTypedDocument<
	RequestPasswordResetMutation,
	RequestPasswordResetMutationVariables
>(RequestPasswordResetDocument);

const userSetDefaultAddressDocument = toTypedDocument<
	UserSetDefaultAddressMutation,
	UserSetDefaultAddressMutationVariables
>(UserSetDefaultAddressDocument);

/** Live checkout read for client sync — bypasses Next.js router/RSC cache. */
export async function syncCheckoutFromServer(checkoutId: string): Promise<CheckoutFetchResult> {
	return fetchCheckoutOnServer(checkoutId);
}

export async function updateCheckoutEmail(checkoutId: string, email: string): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutEmailUpdateDocument, {
		variables: {
			checkoutId,
			email,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutEmailUpdate);
}

/** Persists guest marketing consent on checkout metadata for ORDER_CREATED webhooks / ESP apps. */
export async function updateCheckoutMarketingConsent(
	checkoutId: string,
	optedIn: boolean,
): Promise<SimpleActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutMetadataUpdateDocument, {
		variables: {
			id: checkoutId,
			input: buildMarketingConsentMetadata(optedIn),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const errors = result.data.updateMetadata?.errors ?? [];
	if (errors.length > 0) {
		const { server: t } = await getCheckoutServerTranslations();
		return {
			ok: false,
			error: errors[0]?.message ?? t("marketingSaveFailed"),
		};
	}

	return { ok: true };
}

export interface RecordCheckoutPaymentInfoInput {
	checkoutId: string;
	methodName: string;
	gateway: "vnpay" | "momo" | "test-card";
	note?: string;
	metadata?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Persists payment method name, gateway, notes, and technical metadata onto the checkout.
 * Saleor Core automatically copies `checkout.note` to `order.customer_note` and
 * `checkout.metadata` to `order.metadata` during order completion.
 */
export async function recordCheckoutPaymentInfo(
	input: RecordCheckoutPaymentInfoInput,
): Promise<SimpleActionResult> {
	const { checkoutId, methodName, gateway, note, metadata } = input;

	try {
		// 1. Update customer note on checkout (shows prominently in Saleor Dashboard Customer Notes)
		if (note && note.trim()) {
			const noteQuery = `
				mutation CheckoutCustomerNoteUpdate($id: ID!, $customerNote: String!) {
					checkoutCustomerNoteUpdate(id: $id, customerNote: $customerNote) {
						errors {
							field
							message
							code
						}
					}
				}
			`;
			await executeRawGraphQL({
				query: noteQuery,
				variables: {
					id: checkoutId,
					customerNote: note.trim(),
				},
			});
		}

		// 2. Build metadata items for Saleor Metadata table
		const metadataItems: Array<{ key: string; value: string }> = [
			{ key: "payment_method", value: methodName },
			{ key: "payment_gateway", value: gateway },
			{ key: "payment_status", value: "PAID" },
			{ key: "payment_recorded_at", value: new Date().toISOString() },
		];

		if (metadata) {
			for (const [k, v] of Object.entries(metadata)) {
				if (v !== undefined && v !== null && String(v).trim()) {
					metadataItems.push({ key: k, value: String(v) });
				}
			}
		}

		// 3. Update checkout metadata (Saleor automatically copies this to Order on complete)
		const metaResult = await executeAuthenticatedGraphQL(checkoutMetadataUpdateDocument, {
			variables: {
				id: checkoutId,
				input: metadataItems,
			},
			cache: "no-cache",
		});

		if (!metaResult.ok) {
			console.warn("Could not update checkout payment metadata:", metaResult.error);
		}
	} catch (err) {
		console.warn("Soft error recording checkout payment info:", err);
	}

	return { ok: true };
}

export async function updateCheckoutShippingAddress(
	checkoutId: string,
	shippingAddress: AddressInput,
	saveAddress?: boolean,
): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutShippingAddressUpdateDocument, {
		variables: {
			checkoutId,
			shippingAddress,
			saveAddress,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutShippingAddressUpdate);
}

export async function attachCustomerToCheckout(checkoutId: string): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutCustomerAttachDocument, {
		variables: {
			checkoutId,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutCustomerAttach);
}

export async function registerCheckoutAccount(input: {
	email: string;
	password: string;
	channel: string;
	redirectUrl: string;
}): Promise<SimpleActionResult> {
	// Confirmation emails embed this URL — reject foreign origins (phishing vector).
	if (!isAllowedRedirectUrl(input.redirectUrl)) {
		const { server: t } = await getCheckoutServerTranslations();
		console.warn(
			"Received an invalid redirection URL for password reset. " +
				"Make sure to configure NEXT_PUBLIC_STOREFRONT_URL, " +
				"see https://github.com/saleor/saleor-docs/blob/-/docs/configuration/allowed-origins.md",
			{ redirectUrl: input.redirectUrl },
		);
		return { ok: false, error: t("invalidRedirectUrl") };
	}

	const result = await executeRawGraphQL<{
		accountRegister?: {
			errors: Array<{ field?: string | null; message?: string | null; code?: string | null }>;
		};
	}>({
		query: `mutation AccountRegister($input: AccountRegisterInput!) {
			accountRegister(input: $input) {
				errors { field message code }
			}
		}`,
		variables: { input },
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const errors = result.data.accountRegister?.errors ?? [];
	if (errors.length > 0) {
		const uniqueOnly = errors.every((error) => error.code === "UNIQUE");
		if (uniqueOnly) {
			return { ok: true };
		}

		const { server: t } = await getCheckoutServerTranslations();
		return {
			ok: false,
			fieldErrors: errors.map(
				(error): CheckoutFieldError => ({
					field: error.field,
					message: error.message ?? t("createAccountFailed"),
					code: error.code as CheckoutFieldError["code"],
				}),
			),
		};
	}

	return { ok: true };
}

type RecoverLine = { variantId: string; quantity: number };

export async function recoverOrphanedCheckout(
	channel: string,
	lines: RecoverLine[],
): Promise<CheckoutActionResult & { checkoutId?: string }> {
	const locale = await resolveCheckoutLocaleSlug();
	const createResult = await executeAuthenticatedGraphQL(checkoutCreateDocument, {
		variables: {
			channel,
			languageCode: graphqlLanguageCodeVariables(locale).languageCode,
			metadata: await checkoutCreateContextMetadata(locale),
		},
		cache: "no-cache",
	});

	if (!createResult.ok) {
		return { ok: false, error: createResult.error.message };
	}

	const created = toCheckoutActionResult(createResult.data.checkoutCreate);
	if (!created.ok) {
		return created;
	}

	let checkout = created.checkout;

	if (lines.length > 0) {
		const linesResult = await executeAuthenticatedGraphQL(checkoutLinesAddDocument, {
			variables: {
				checkoutId: checkout.id,
				lines,
				languageCode: await checkoutGraphqlLanguageCode(),
			},
			cache: "no-cache",
		});

		if (!linesResult.ok) {
			return { ok: false, error: linesResult.error.message };
		}

		const added = toCheckoutActionResult(linesResult.data.checkoutLinesAdd);
		if (!added.ok) {
			return added;
		}

		checkout = added.checkout;
	}

	await saveCheckoutId(channel, checkout.id);

	return { ok: true, checkout, checkoutId: checkout.id };
}

export async function detachCheckoutCustomer(checkoutId: string): Promise<void> {
	await Checkout.detachCustomer(checkoutId);
}

export async function calculateDeliveryOptions(checkoutId: string): Promise<DeliveryOptionsActionResult> {
	const result = await executeAuthenticatedGraphQL(deliveryOptionsCalculateDocument, {
		variables: { id: checkoutId },
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const payload = result.data.deliveryOptionsCalculate;
	if (!payload) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: t("noSaleorResponse") };
	}

	if (payload.errors?.length) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: payload.errors[0].message ?? t("shippingMethodsFailed") };
	}

	return { ok: true, deliveries: payload.deliveries ?? [] };
}

export async function updateCheckoutDeliveryMethod(
	checkoutId: string,
	deliveryMethodId: string,
): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutDeliveryMethodUpdateDocument, {
		variables: {
			checkoutId,
			deliveryMethodId,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutDeliveryMethodUpdate);
}

export async function updateCheckoutBillingAddress(input: {
	checkoutId: string;
	billingAddress: AddressInput;
	saveAddress: boolean;
}): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutBillingAddressUpdateDocument, {
		variables: {
			checkoutId: input.checkoutId,
			billingAddress: input.billingAddress,
			saveAddress: input.saveAddress,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutBillingAddressUpdate);
}

export async function initializePaymentGateways(
	variables: PaymentGatewaysInitializeMutationVariables,
): Promise<PaymentGatewaysInitializeActionResult> {
	const result = await executeAuthenticatedGraphQL(paymentGatewaysInitializeDocument, {
		variables,
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const payload = result.data.paymentGatewayInitialize;
	if (!payload) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: t("noSaleorResponse") };
	}

	if (payload.errors?.length) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: payload.errors[0].message ?? t("gatewayInitFailed") };
	}

	return { ok: true, data: payload };
}

export async function initializeCheckoutTransaction(
	variables: TransactionInitializeMutationVariables,
): Promise<TransactionInitializeActionResult> {
	const { server: t } = await getCheckoutServerTranslations();

	const dummyGuardError = getDummyPaymentGuardError(variables.paymentGateway?.id);
	if (dummyGuardError) {
		return { ok: false, error: t("dummyNotAllowed") };
	}

	const stripeGuardError = getStripePaymentGuardError(variables.paymentGateway?.id);
	if (stripeGuardError) {
		return { ok: false, error: t("stripeNotEnabled") };
	}

	// Defense in depth: never trust the client-supplied amount. Saleor re-validates
	// coverage at checkoutComplete, but rejecting here avoids authorizing a wrong amount.
	if (typeof variables.amount === "number") {
		const live = await fetchCheckoutOnServer(variables.checkoutId);
		if (!live.ok || !live.checkout) {
			return { ok: false, error: t("totalVerifyFailed") };
		}

		const liveAmount = getCheckoutPayAmount(live.checkout);
		if (liveAmount === null || hasMaterialCheckoutTotalChange(liveAmount, variables.amount)) {
			return {
				ok: false,
				error: t("totalChanged"),
			};
		}
	}

	const gatewayId = variables.paymentGateway?.id;
	if (gatewayId && (gatewayId === "mirumee.payments.dummy" || gatewayId === "saleor.io.dummy-payment-app" || isDummyGateway({ id: gatewayId, name: "" }))) {
		const live = await fetchCheckoutOnServer(variables.checkoutId);
		if (!live.ok || !live.checkout) {
			return { ok: false, error: t("totalVerifyFailed") };
		}

		const payAmount = getCheckoutPayAmount(live.checkout) ?? variables.amount ?? 0;
		const currency = live.checkout.totalPrice?.gross?.currency ?? "USD";

		const gatewayData = variables.paymentGateway?.data as Record<string, unknown> | undefined;
		const customMethodName =
			typeof gatewayData?.paymentMethodName === "string" && gatewayData.paymentMethodName.trim()
				? gatewayData.paymentMethodName.trim()
				: "Dummy Payment";
		const customPspRef =
			typeof gatewayData?.pspReference === "string" && gatewayData.pspReference.trim()
				? gatewayData.pspReference.trim()
				: undefined;
		const customMessage =
			typeof gatewayData?.message === "string" && gatewayData.message.trim()
				? gatewayData.message.trim()
				: undefined;

		const result = await executeAppGraphQL(transactionCreateDocument, {
			variables: {
				id: variables.checkoutId,
				transaction: {
					name: customMethodName,
					pspReference: customPspRef,
					message: customMessage,
					amountCharged: {
						amount: payAmount,
						currency,
					},
				},
			},
			cache: "no-cache",
		});

		if (!result.ok) {
			return { ok: false, error: result.error.message };
		}

		const payload = result.data.transactionCreate;
		if (payload?.errors?.length) {
			return { ok: false, error: payload.errors[0].message ?? t("paymentInitFailed") };
		}

		return {
			ok: true,
			data: {
				transaction: payload?.transaction,
				data: null,
				errors: [],
			},
		};
	}

	const result = await executeAuthenticatedGraphQL(transactionInitializeDocument, {
		variables,
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const payload = result.data.transactionInitialize;
	if (!payload) {
		return { ok: false, error: t("noSaleorResponse") };
	}

	if (payload.errors?.length) {
		return { ok: false, error: payload.errors[0].message ?? t("paymentInitFailed") };
	}

	return { ok: true, data: payload };
}

export async function processCheckoutTransaction(
	variables: TransactionProcessMutationVariables,
): Promise<TransactionProcessActionResult> {
	// Mirror the initialize guards: when every integrated gateway is disabled for this
	// environment, a direct call to this action must not drive transactions either.
	// Forks adding gateways should extend this check alongside the initialize guards.
	if (!isStripePaymentEnabled() && !isDummyPaymentAllowed()) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: t("paymentsDisabled") };
	}

	const result = await executeAuthenticatedGraphQL(transactionProcessDocument, {
		variables,
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const payload = result.data.transactionProcess;
	if (!payload) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: t("noSaleorResponse") };
	}

	if (payload.errors?.length) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: payload.errors[0].message ?? t("paymentProcessFailed") };
	}

	return { ok: true, data: payload };
}

export async function runCheckoutComplete(checkoutId: string): Promise<CheckoutCompleteActionResult> {
	// Before complete — Saleor copies checkout public metadata onto the order.
	await enrichCheckoutCommerceContext(checkoutId);

	const result = await executeAuthenticatedGraphQL(checkoutCompleteDocument, {
		variables: { checkoutId },
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const payload = result.data.checkoutComplete;
	if (!payload) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: t("noSaleorResponse") };
	}

	if (payload.errors?.length) {
		const { server: t } = await getCheckoutServerTranslations();
		return {
			ok: false,
			error: payload.errors[0].message ?? t("completeOrderFailed"),
			fieldErrors: payload.errors.map((error) => ({
				field: error.field,
				message: error.message ?? t("completeOrderFailed"),
				code: error.code,
			})),
		};
	}

	const orderId = payload.order?.id;
	if (!orderId) {
		const { server: t } = await getCheckoutServerTranslations();
		return {
			ok: false,
			error: t("orderCreateFailed"),
		};
	}

	// Return orderViewToken for client `navigateToOrderConfirmation()` — do not `redirect()` here (see
	// navigate-to-order.ts). Cookie clear runs in `after()` so the client can leave
	// `/checkout?checkout=…` first; RootViews keeps PaymentCompletingScreen up meanwhile.
	// No cache invalidation: cart chrome is a cookie-gated dynamic hole, the client
	// hard-navigates to order confirmation, and other tabs sync via bumpChromeVersion()
	// in navigateToOrderConfirmation().
	const orderViewToken = signOrderViewToken(orderId);
	await setOrderViewCookie(orderViewToken);

	const order = payload.order;
	emitCommerceEvent({
		name: "checkout_completed",
		channel: order?.channel?.slug ?? "",
		value: order?.total?.gross?.amount ?? 0,
		currency: order?.total?.gross?.currency ?? "",
		transactionId: orderId,
	});

	after(async () => {
		await Checkout.clearCheckoutCookieByValue(checkoutId);
	});

	return { ok: true, orderId, orderViewToken };
}

export async function getAddressValidationRules(
	countryCode: CountryCode,
): Promise<AddressValidationRulesActionResult> {
	const result = await executePublicGraphQL(addressValidationRulesDocument, {
		variables: { countryCode },
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	if (!result.data.addressValidationRules) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: t("validationRulesUnavailable") };
	}

	return { ok: true, rules: result.data.addressValidationRules };
}

export async function removeCheckoutLine(checkoutId: string, lineId: string): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutLinesDeleteDocument, {
		variables: {
			checkoutId,
			linesIds: [lineId],
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutLinesDelete);
}

export async function applyCheckoutPromoCode(
	checkoutId: string,
	promoCode: string,
): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutAddPromoCodeDocument, {
		variables: {
			checkoutId,
			promoCode,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutAddPromoCode);
}

export async function removeCheckoutPromoCode(
	checkoutId: string,
	promoCode: string,
): Promise<CheckoutActionResult> {
	const result = await executeAuthenticatedGraphQL(checkoutRemovePromoCodeDocument, {
		variables: {
			checkoutId,
			promoCode,
			languageCode: await checkoutGraphqlLanguageCode(),
		},
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	return toCheckoutActionResult(result.data.checkoutRemovePromoCode);
}

export async function requestCheckoutPasswordReset(input: {
	email: string;
	channel: string;
	redirectUrl: string;
}): Promise<SimpleActionResult> {
	// Reset emails embed this URL — reject foreign origins (phishing vector).
	if (!isAllowedRedirectUrl(input.redirectUrl)) {
		const { server: t } = await getCheckoutServerTranslations();
		console.warn(
			"Received an invalid redirection URL for password reset. " +
				"Make sure to configure NEXT_PUBLIC_STOREFRONT_URL, " +
				"see https://github.com/saleor/saleor-docs/blob/-/docs/configuration/allowed-origins.md",
			{ redirectUrl: input.redirectUrl },
		);
		return { ok: false, error: t("invalidRedirectUrl") };
	}

	const result = await executeRawGraphQL<RequestPasswordResetMutation>({
		query: requestPasswordResetDocument.toString(),
		variables: input,
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	// Swallow Saleor validation errors (e.g. unknown email) — same anti-enumeration
	// posture as POST /api/auth/reset-password.
	const errors = result.data.requestPasswordReset?.errors ?? [];
	if (errors.length > 0) {
		console.error("Checkout password reset validation errors");
	}

	return { ok: true };
}

export async function setUserDefaultAddress(
	addressId: string,
	type: AddressTypeEnum,
): Promise<SimpleActionResult> {
	const result = await executeAuthenticatedGraphQL(userSetDefaultAddressDocument, {
		variables: { id: addressId, type },
		cache: "no-cache",
	});

	if (!result.ok) {
		return { ok: false, error: result.error.message };
	}

	const errors = result.data.accountSetDefaultAddress?.errors ?? [];
	if (errors.length > 0) {
		const { server: t } = await getCheckoutServerTranslations();
		return { ok: false, error: errors[0].message ?? t("setDefaultAddressFailed") };
	}

	return { ok: true };
}

import { type ReactElement } from "react";

/**
 * Defensive guard against intrusive browser extensions (e.g., Touch VPN, BriskBard,
 * Kaspersky, translation extensions, skin themes, ad blockers).
 *
 * Such extensions inject synthetic attributes (e.g., `bis_skin_checked="1"`) into DOM
 * elements before or during Next.js client hydration, which causes React SSR hydration
 * mismatch errors (specifically on `<MetadataWrapper>` / `<div hidden>`).
 *
 * This component runs synchronously in `<head>` to:
 * 1. Attach a MutationObserver to immediately strip `bis_skin_checked` and similar
 *    injected extension attributes from the DOM.
 * 2. Filter out noisy console errors and unhandled rejections caused by third-party
 *    extension scripts (UtilityScript, bis_skin_checked, Range exceptions).
 */
export function BrowserExtensionGuard(): ReactElement {
	return (
		<script
			dangerouslySetInnerHTML={{
				__html: `
					(function() {
						if (typeof window === 'undefined') return;

						// 1. Immediately clean & observe extension-injected attributes
						try {
							var cleanExtensionAttributes = function(el) {
								if (!el) return;
								if (el.nodeType === 1 && el.hasAttribute && el.hasAttribute('bis_skin_checked')) {
									el.removeAttribute('bis_skin_checked');
								}
								if (el.querySelectorAll) {
									var nodes = el.querySelectorAll('[bis_skin_checked]');
									for (var k = 0; k < nodes.length; k++) {
										nodes[k].removeAttribute('bis_skin_checked');
									}
								}
							};

							if (typeof MutationObserver !== 'undefined' && document.documentElement) {
								var observer = new MutationObserver(function(mutations) {
									for (var i = 0; i < mutations.length; i++) {
										var m = mutations[i];
										if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
											if (m.target && m.target.removeAttribute) {
												m.target.removeAttribute('bis_skin_checked');
											}
										} else if (m.type === 'childList') {
											for (var j = 0; j < m.addedNodes.length; j++) {
												cleanExtensionAttributes(m.addedNodes[j]);
											}
										}
									}
								});
								observer.observe(document.documentElement, {
									attributes: true,
									subtree: true,
									childList: true,
									attributeFilter: ['bis_skin_checked'],
								});
							}

							cleanExtensionAttributes(document.documentElement);
							if (document.readyState === 'loading') {
								document.addEventListener('DOMContentLoaded', function() {
									cleanExtensionAttributes(document.documentElement);
								});
							}
						} catch(e) {}

						// 2. Intercept noisy console messages from extensions & hydration mismatch diffs
						var isNoise = function(text) {
							if (!text || typeof text !== 'string') return false;
							return (
								text.indexOf('bis_skin_checked') !== -1 ||
								text.indexOf('UtilityScript') !== -1 ||
								text.indexOf('chrome-extension') !== -1 ||
								text.indexOf('moz-extension') !== -1 ||
								text.indexOf('installHook.js') !== -1 ||
								text.indexOf('updateFiberRecursively') !== -1 ||
								text.indexOf('updateVirtualChildrenRecursively') !== -1 ||
								text.indexOf('updateVirtualInstanceRecursively') !== -1 ||
								text.indexOf('The children should not have changed if we pass in the same set') !== -1 ||
								text.indexOf('React instrumentation encountered an error') !== -1 ||
								text.indexOf('fmkadmapgofadopljbjfkapdkoienihi') !== -1 ||
								text.indexOf('M_ID') !== -1 ||
								text.indexOf('There is no child at offset') !== -1 ||
								text.indexOf("Failed to execute 'setEnd' on 'Range'") !== -1 ||
								text.indexOf("Failed to execute 'setStart' on 'Range'") !== -1
							);
						};

						var extractText = function(item) {
							if (!item) return '';
							if (typeof item === 'string') return item;
							var t = '';
							if (typeof item === 'object') {
								if (item.name) t += item.name + ' ';
								if (item.message) t += item.message + ' ';
								if (item.stack) t += item.stack + ' ';
								try {
									t += JSON.stringify(item) + ' ';
								} catch(e) {}
							}
							try {
								t += String(item) + ' ';
							} catch(e) {}
							return t;
						};

						var shouldFilterLog = function(args) {
							if (!args || args.length === 0) return false;
							var combined = '';
							for (var i = 0; i < args.length; i++) {
								combined += extractText(args[i]) + ' ';
							}
							if (isNoise(combined)) return true;
							try {
								var stack = new Error().stack || '';
								if (isNoise(stack)) return true;
							} catch(e) {}
							return false;
						};

						var origConsoleError = window.console.error;
						window.console.error = function() {
							var args = arguments;
							if (args.length === 0 || args[0] === undefined || args[0] === null) return;
							if (shouldFilterLog(args)) return;
							if (origConsoleError) origConsoleError.apply(console, args);
						};

						var origConsoleWarn = window.console.warn;
						window.console.warn = function() {
							var args = arguments;
							if (args.length === 0 || args[0] === undefined || args[0] === null) return;
							if (shouldFilterLog(args)) return;
							if (origConsoleWarn) origConsoleWarn.apply(console, args);
						};

						// 3. Catch unhandled errors & rejections emitted by third-party extension scripts
						window.addEventListener('error', function(event) {
							var msg = (event && (event.message || (event.error && event.error.message))) || String((event && event.error) || '');
							var filename = (event && event.filename) || '';
							var stack = (event && event.error && event.error.stack) || '';
							var combined = msg + ' ' + filename + ' ' + stack;

							if (
								!msg ||
								msg === 'undefined' ||
								isNoise(combined) ||
								(event && event.error && event.error.name === 'IndexSizeError')
							) {
								if (event.preventDefault) event.preventDefault();
								if (event.stopImmediatePropagation) event.stopImmediatePropagation();
								return true;
							}
						}, true);

						window.addEventListener('unhandledrejection', function(event) {
							var reason = event && event.reason;
							var reasonStr = String((reason && reason.message) || reason || '');
							var stack = String((reason && reason.stack) || '');
							var combined = reasonStr + ' ' + stack;

							if (
								!reason ||
								reasonStr === 'undefined' ||
								reasonStr === '' ||
								isNoise(combined) ||
								(reason && reason.name === 'IndexSizeError')
							) {
								if (event.preventDefault) event.preventDefault();
								if (event.stopImmediatePropagation) event.stopImmediatePropagation();
							}
						}, true);
					})();
				`,
			}}
		/>
	);
}

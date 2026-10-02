import json
import os

EN_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "messages", "en.json")
VI_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "messages", "vi.json")

with open(EN_PATH, "r", encoding="utf-8") as f:
    en = json.load(f)

# Comprehensive translations dictionary
VI_TRANSLATIONS = {
    "cart": {
        "drawer": {
            "itemCount": "{count, plural, one {# sản phẩm} other {# sản phẩm}}",
            "subtotal": "Tạm tính",
            "shipping": "Vận chuyển",
            "shippingFree": "Miễn phí",
            "shippingCalculated": "Tính khi thanh toán",
            "total": "Tổng cộng",
            "checkout": "Thanh toán",
            "continueShopping": "Tiếp tục mua sách",
            "removeItem": "Xóa {product}",
            "decreaseQuantity": "Giảm số lượng",
            "increaseQuantity": "Tăng số lượng"
        },
        "page": {
            "title": "Giỏ hàng của bạn",
            "quantity": "Số lượng: {count}",
            "variant": "Phiên bản: {name}",
            "yourTotal": "Tổng thanh toán",
            "shippingNote": "Phí vận chuyển sẽ được tính tại bước tiếp theo",
            "checkout": "Tiến hành thanh toán"
        }
    },
    "productsListing": {
        "breadcrumbHome": "Trang chủ",
        "breadcrumbProducts": "Danh mục sách"
    },
    "common": {
        "pagination": {
            "previous": "Trước",
            "next": "Tiếp theo"
        }
    },
    "pdp": {
        "addToBag": "Thêm vào giỏ",
        "adding": "Đang thêm...",
        "outOfStock": "Hết hàng",
        "selectOptions": "Chọn phiên bản",
        "buyBox": {
            "overBudgetHint": "Sản phẩm này có nhiều lựa chọn. Mở liên kết cụ thể để mua.",
            "externalHint": "Lựa chọn được tuỳ chỉnh riêng. Mở liên kết cụ thể để mua.",
            "selectedSummary": "Lựa chọn đã chọn"
        },
        "free": "MIỄN PHÍ",
        "breadcrumbHome": "Trang chủ",
        "badges": {
            "sale": "Giảm giá",
            "new": "Mới",
            "bestseller": "Bán chạy"
        },
        "variant": {
            "outOfStockTitle": "{name} - Tạm hết hàng",
            "willChangeSelections": "{name} - Sẽ thay đổi lựa chọn",
            "percentOffTitle": "{name} - Giảm {percent}%",
            "outOfStockA11y": "hết hàng",
            "percentOffA11y": "giảm {percent}%",
            "selectedA11y": "đã chọn",
            "chooseOption": "Chọn {label}",
            "searchOptions": "Tìm {label}"
        }
    },
    "plp": {
        "title": "Tất cả sách & ấn phẩm",
        "filter": "Bộ lọc",
        "sortBy": "Sắp xếp theo",
        "sortOptions": {
            "featured": "Nổi bật",
            "priceAsc": "Giá: Thấp đến Cao",
            "priceDesc": "Giá: Cao đến Thấp",
            "newest": "Mới nhất",
            "rating": "Đánh giá cao nhất"
        },
        "clearAll": "Xóa tất cả",
        "results": "{count, plural, one {# kết quả} other {# kết quả}}",
        "noProducts": "Không tìm thấy ấn phẩm nào phù hợp."
    },
    "search": {
        "placeholder": "Tìm kiếm tựa sách, tác giả, ISBN hoặc nội dung AI...",
        "title": "Kết quả tìm kiếm",
        "emptyTitle": "Không tìm thấy kết quả",
        "emptyDescription": "Hãy thử tìm bằng từ khóa khác hoặc sử dụng tính năng tìm kiếm ngữ nghĩa AI.",
        "recentSearches": "Tìm kiếm gần đây",
        "clear": "Xóa"
    },
    "nav": {
        "home": "Trang chủ",
        "books": "Tủ sách",
        "categories": "Thể loại",
        "about": "Giới thiệu",
        "contact": "Liên hệ",
        "cart": "Giỏ hàng",
        "search": "Tìm kiếm",
        "account": {
            "open": "Mở menu người dùng",
            "login": "Đăng nhập",
            "myAccount": "Tài khoản của tôi",
            "myOrders": "Đơn hàng của tôi",
            "logOut": "Đăng xuất",
            "unavailableAriaLabel": "Tài khoản không khả dụng",
            "unavailableTitle": "Không thể tải tài khoản"
        },
        "regionPicker": {
            "ariaLabel": "Ngôn ngữ và thị trường",
            "languageTitle": "Ngôn ngữ",
            "languageDescription": "Hiển thị và định dạng",
            "marketTitle": "Thị trường",
            "marketDescription": "Tiền tệ, thuế & vận chuyển"
        }
    },
    "account": {
        "metadata": {
            "loginTitle": "Đăng nhập",
            "loginDescription": "Đăng nhập vào tài khoản AuraBook để xem đơn hàng và sách của bạn.",
            "signupTitle": "Tạo tài khoản",
            "signupDescription": "Tạo tài khoản mới để lưu địa chỉ và lịch sử mua sách.",
            "accountTitle": "Tài khoản của tôi"
        },
        "fields": {
            "email": "Email",
            "emailAddress": "Địa chỉ email",
            "password": "Mật khẩu",
            "firstName": "Tên",
            "lastName": "Họ và tên đệm",
            "confirmPassword": "Xác nhận mật khẩu",
            "currentPassword": "Mật khẩu hiện tại",
            "newPassword": "Mật khẩu mới",
            "confirmNewPassword": "Xác nhận mật khẩu mới",
            "name": "Họ và tên",
            "companyOptional": "Công ty (tùy chọn)",
            "streetAddress": "Địa chỉ",
            "streetAddress2Optional": "Số nhà, căn hộ (tùy chọn)",
            "city": "Tỉnh / Thành phố",
            "postalCode": "Mã bưu chính",
            "stateProvince": "Quận / Huyện",
            "countryCode": "Mã quốc gia",
            "phoneOptional": "Số điện thoại",
            "country": "Quốc gia",
            "cityArea": "Phường / Xã",
            "localized": {
                "province": "Tỉnh thành",
                "district": "Quận huyện",
                "state": "Bang",
                "zip": "Mã bưu điện",
                "postal": "Mã bưu chính",
                "postTown": "Thị xã",
                "prefecture": "Tỉnh"
            }
        },
        "placeholders": {
            "email": "ban@example.com",
            "password": "Nhập mật khẩu",
            "firstName": "Tên",
            "lastName": "Họ",
            "newPasswordMin": "Tối thiểu 8 ký tự…"
        },
        "orders": {
            "title": "Đơn hàng của tôi",
            "empty": "Bạn chưa có đơn hàng nào.",
            "orderNumber": "Đơn hàng #{number}",
            "placedOn": "Đặt ngày {date}",
            "status": "Trạng thái",
            "total": "Tổng tiền",
            "viewDetails": "Xem chi tiết",
            "UNFULFILLED": "Chờ xử lý",
            "UNFULFILLEDDescription": "Đơn hàng đang chờ xử lý",
            "PARTIALLY_FULFILLED": "Đang giao một phần",
            "PARTIALLY_FULFILLEDDescription": "Một số sản phẩm đang được giao",
            "FULFILLED": "Đã giao",
            "FULFILLEDDescription": "Đơn hàng đã được giao thành công",
            "CANCELED": "Đã hủy",
            "CANCELEDDescription": "Đơn hàng đã bị hủy",
            "REFUNDED": "Đã hoàn tiền",
            "REFUNDEDDescription": "Đã hoàn lại tiền đơn hàng",
            "REFUNDED_AND_RETURNED": "Đã hoàn trả & hoàn tiền",
            "REFUNDED_AND_RETURNEDDescription": "Sản phẩm đã hoàn trả và được hoàn tiền",
            "REPLACED": "Đã đổi hàng",
            "REPLACEDDescription": "Sản phẩm đã được đổi mới",
            "RETURNED": "Đã hoàn trả",
            "RETURNEDDescription": "Sản phẩm đã được hoàn trả",
            "WAITING_FOR_APPROVAL": "Chờ phê duyệt",
            "WAITING_FOR_APPROVALDescription": "Đơn hàng đang chờ duyệt",
            "trackingUpdated": "Cập nhật mã vận đơn",
            "trackingNumber": "Mã vận đơn: {number}",
            "descriptionWithItems": "{description} ({count, plural, one {# sản phẩm} other {# sản phẩm}})"
        },
        "settings": {
            "title": "Cài đặt",
            "subtitle": "Quản lý thông tin tài khoản của bạn",
            "memberSince": "Thành viên từ {date}"
        },
        "addresses": {
            "title": "Sổ địa chỉ",
            "subtitle": "Quản lý địa chỉ giao hàng đã lưu",
            "empty": "Chưa có địa chỉ nào được lưu.",
            "addAddress": "Thêm địa chỉ",
            "editAddress": "Sửa địa chỉ",
            "addNewAddress": "Thêm địa chỉ mới",
            "editAddressDescription": "Cập nhật chi tiết địa chỉ",
            "addAddressDescription": "Thêm địa chỉ mới vào tài khoản",
            "editAddressAria": "Sửa địa chỉ",
            "updateAddress": "Cập nhật địa chỉ",
            "deleteAddressAria": "Xóa địa chỉ",
            "defaultShipping": "Địa chỉ giao hàng mặc định",
            "defaultBilling": "Địa chỉ thanh toán mặc định",
            "makeDefaultShipping": "Đặt làm mặc định giao hàng",
            "makeDefaultBilling": "Đặt làm mặc định thanh toán"
        },
        "deleteAccount": {
            "title": "Xóa tài khoản",
            "description": "Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan.",
            "submit": "Xóa tài khoản",
            "confirm": "Tôi xác nhận xóa tài khoản",
            "confirmBody": "Hành động này không thể hoàn tác. Bạn sẽ nhận được email xác nhận.",
            "emailSent": "Email xác nhận đã được gửi. Vui lòng kiểm tra hộp thư đến."
        },
        "changePassword": {
            "submit": "Đổi mật khẩu"
        },
        "unavailable": {
            "title": "Không thể tải tài khoản",
            "body": "Dịch vụ tạm thời bận. Vui lòng tải lại trang hoặc thử lại sau giây lát."
        }
    },
    "checkout": {
        "steps": {
            "information": "Thông tin",
            "shipping": "Vận chuyển",
            "payment": "Thanh toán",
            "stepsAriaLabel": "Các bước thanh toán",
            "secureCheckout": "Thanh toán bảo mật",
            "complete": "Hoàn tất",
            "stepOf": "Bước {step} trên {total}"
        },
        "actions": {
            "saving": "Đang lưu…",
            "loading": "Đang tải…",
            "continueToShipping": "Tiếp tục đến phương thức vận chuyển",
            "continueToPayment": "Tiếp tục đến thanh toán",
            "continue": "Tiếp tục",
            "continueAsGuest": "Thanh toán không cần đăng nhập",
            "preparingGuestCart": "Đang chuẩn bị giỏ hàng…",
            "logIn": "Đăng nhập",
            "returnToInformation": "Quay lại thông tin",
            "returnToShipping": "Quay lại vận chuyển",
            "payNow": "Thanh toán ngay",
            "payTotal": "Thanh toán {total}",
            "completeOrder": "Hoàn tất đơn hàng",
            "placingOrder": "Đang tạo đơn hàng…",
            "creatingOrder": "Đang tạo đơn hàng…",
            "processingPayment": "Đang xử lý thanh toán…",
            "continueShopping": "Tiếp tục mua sách",
            "tryAgain": "Thử lại"
        },
        "errors": {
            "sessionExpiredTitle": "Phiên thanh toán đã hết hạn",
            "sessionExpiredMessage": "Giỏ hàng này không còn hiệu lực. Vui lòng thêm lại sản phẩm để bắt đầu thanh toán mới.",
            "loadFailedTitle": "Không thể tải phiên thanh toán",
            "loadFailedMessage": "Có lỗi khi tải giỏ hàng. Vui lòng thử lại hoặc bắt đầu thanh toán mới.",
            "orderNotFoundTitle": "Không tìm thấy đơn hàng",
            "orderNotFoundMessage": "Không thể tìm thấy đơn hàng này. Liên kết có thể không hợp lệ.",
            "emailRequired": "Vui lòng nhập địa chỉ email",
            "selectShippingAddress": "Vui lòng chọn địa chỉ giao hàng",
            "selectShippingMethod": "Vui lòng chọn phương thức vận chuyển",
            "updateShippingMethodFailed": "Cập nhật phương thức vận chuyển thất bại",
            "orphanedCartMessage": "Giỏ hàng này liên kết với tài khoản đã đăng nhập. Hãy đăng nhập để tiếp tục.",
            "orphanedCartBlocked": "Giỏ hàng liên kết tài khoản. Tiếp tục dưới dạng khách hoặc đăng nhập.",
            "discountApplyFailed": "Không thể áp dụng mã giảm giá này.",
            "discountRemoveFailed": "Không thể xóa mã giảm giá.",
            "invalidValue": "Giá trị không hợp lệ",
            "updateEmailFailed": "Không thể cập nhật email",
            "createAccountFailed": "Tạo tài khoản thất bại",
            "updateAddressFailed": "Cập nhật địa chỉ thất bại",
            "genericError": "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại."
        },
        "payment": {
            "totalUpdatedTitle": "Tổng tiền đã được cập nhật",
            "totalUpdatedBody": "Tổng giá trị đơn hàng đã thay đổi từ {previous} thành {next}.",
            "deliveryInvalidTitle": "Phương thức giao hàng không khả dụng",
            "deliveryInvalidBody": "Phương thức vận chuyển đã chọn không còn khả dụng cho giỏ hàng này.",
            "dummyGateway": "Cổng thanh toán thử nghiệm Sandbox",
            "dummyTestMode": "Môi trường Sandbox (VNPay / MoMo / ZaloPay)",
            "stripeUseCardForm": "Vui lòng hoàn tất biểu mẫu thẻ",
            "noGatewayConfigured": "Chưa có cổng thanh toán nào được cấu hình",
            "paymentTryAgain": "Thanh toán không thành công. Vui lòng thử lại."
        }
    }
}

# Recursively merge VI_TRANSLATIONS over a base copy of en so all nested keys exist
def deep_merge(base, override):
    result = dict(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = deep_merge(result[k], v)
        else:
            result[k] = v
    return result

merged = deep_merge(en, VI_TRANSLATIONS)

with open(VI_PATH, "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent="\t")

print(f"Generated {VI_PATH} successfully with {len(merged)} top-level sections.")

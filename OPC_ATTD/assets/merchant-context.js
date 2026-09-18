(function (global) {
    "use strict";

    const fallback = {
        name: "Merchant",
        logo: "assets/merchant-default.svg",
        shape: "round"
    };
    const validShapes = new Set(["square", "round", "wide", "wordmark", "tall"]);
    const storageKeys = {
        name: "merchantName",
        logo: "merchantLogo",
        shape: "merchantLogoShape"
    };

    function readStorage(key) {
        try {
            return global.localStorage.getItem(key) || "";
        } catch (error) {
            return "";
        }
    }

    function writeStorage(key, value) {
        try {
            global.localStorage.setItem(key, value);
        } catch (error) {
            // URL propagation still keeps the merchant context available.
        }
    }

    function normalize(merchant) {
        const value = merchant || {};
        const name = String(value.name || fallback.name).trim() || fallback.name;
        let logo = String(value.logo || fallback.logo).trim() || fallback.logo;
        if (logo && !logo.startsWith('http') && !logo.startsWith('assets/') && !logo.startsWith('/')) {
            logo = 'assets/' + logo;
        }
        const requestedShape = String(value.shape || fallback.shape).trim().toLowerCase();
        return {
            name: name.slice(0, 64),
            logo: logo,
            shape: validShapes.has(requestedShape) ? requestedShape : fallback.shape
        };
    }

    function set(merchant) {
        const value = normalize(merchant);
        writeStorage(storageKeys.name, value.name);
        writeStorage(storageKeys.logo, value.logo);
        writeStorage(storageKeys.shape, value.shape);
        return value;
    }

    function get() {
        const params = new URLSearchParams(global.location.search);
        return normalize({
            name: params.get("merchantName") || readStorage(storageKeys.name) || fallback.name,
            logo: params.get("merchantLogo") || readStorage(storageKeys.logo) || fallback.logo,
            shape: params.get("merchantLogoShape") || readStorage(storageKeys.shape) || fallback.shape
        });
    }

    function apply(root) {
        const target = root || global.document;
        const merchant = set(get());

        target.querySelectorAll("[data-merchant-name]").forEach(function (node) {
            node.textContent = merchant.name;
        });

        target.querySelectorAll("[data-merchant-logo-slot]").forEach(function (node) {
            node.dataset.shape = merchant.shape;
            node.setAttribute("aria-label", merchant.name + " merchant logo");
        });

        target.querySelectorAll("[data-merchant-logo]").forEach(function (image) {
            image.onerror = merchant.logo === fallback.logo
                ? null
                : function () {
                    set(fallback);
                    image.onerror = null;
                    image.src = fallback.logo;
                    image.alt = fallback.name + " merchant logo";
                };
            image.src = merchant.logo;
            image.alt = merchant.name + " merchant logo";
        });

        return merchant;
    }

    function appendTo(params) {
        const target = params instanceof URLSearchParams ? params : new URLSearchParams(params || "");
        const merchant = get();
        target.set("merchantName", merchant.name);
        target.set("merchantLogo", merchant.logo);
        target.set("merchantLogoShape", merchant.shape);
        return target;
    }

    global.MerchantContext = {
        fallback: fallback,
        get: get,
        set: set,
        apply: apply,
        appendTo: appendTo
    };

    if (global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", function () { apply(global.document); }, { once: true });
    } else {
        apply(global.document);
    }
})(window);

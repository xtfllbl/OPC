(function () {
    const defaults = {
        serial: "WP5120Q3000001",
        currency: "EUR",
        rate: "0.69",
        charger: "A",
        connector: "A1",
        connectorType: "CCS2",
        power: "150 kW",
        amount: "20.00",
        paid: "20.00",
        consumed: "11.60",
        refund: "8.40",
        kwh: "16.8",
        duration: "00:18",
        session: "EV-260521-1042"
    };

    const params = new URLSearchParams(window.location.search);

    function value(key, fallback) {
        const raw = params.get(key);
        return raw && raw.trim() ? raw.trim() : (fallback || defaults[key] || "");
    }

    function money(amount, currency) {
        const numeric = Number(amount);
        const safeAmount = Number.isFinite(numeric) ? numeric : 0;
        return `${currency || value("currency")} ${safeAmount.toFixed(2)}`;
    }

    function makeQuery(extra) {
        const next = new URLSearchParams(window.location.search);
        Object.keys(extra || {}).forEach(function (key) {
            next.set(key, extra[key]);
        });
        return next.toString();
    }

    function href(page, extra) {
        const query = makeQuery(extra);
        return query ? `${page}?${query}` : page;
    }

    function setText(id, text) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = text;
        }
    }

    function updateClock() {
        const clock = document.getElementById("clock");
        if (!clock) {
            return;
        }
        const now = new Date();
        clock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    function syncCommonText() {
        const currency = value("currency");
        const amount = value("amount");
        const paid = value("paid", amount);
        const consumed = value("consumed");
        const refund = value("refund");
        const connector = value("connector");
        const connectorType = value("connectorType");
        const charger = value("charger");
        const power = value("power");
        const rate = value("rate");

        setText("serial-display", value("serial"));
        setText("charger-display", `Charger ${charger}`);
        setText("connector-display", `${connector} ${connectorType}`);
        setText("connector-short", connector);
        setText("power-display", power);
        setText("rate-display", `${currency} ${Number(rate).toFixed(2)} / kWh`);
        setText("amount-display", money(amount, currency));
        setText("paid-display", money(paid, currency));
        setText("consumed-display", money(consumed, currency));
        setText("refund-display", money(refund, currency));
        setText("kwh-display", `${value("kwh")} kWh`);
        setText("duration-display", value("duration"));
        setText("session-display", value("session"));
    }

    function initLinks() {
        document.querySelectorAll("[data-next-page]").forEach(function (link) {
            link.setAttribute("href", href(link.dataset.nextPage, {}));
        });
    }

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
            return;
        }
        callback();
    }

    window.EV = {
        value: value,
        money: money,
        href: href,
        makeQuery: makeQuery,
        ready: ready,
        setText: setText,
        syncCommonText: syncCommonText
    };

    ready(function () {
        updateClock();
        setInterval(updateClock, 1000);
        syncCommonText();
        initLinks();
    });
})();

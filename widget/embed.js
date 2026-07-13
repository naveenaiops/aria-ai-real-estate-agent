(function () {

    if (document.getElementById("aria-widget-frame")) return;

    const iframe = document.createElement("iframe");

    iframe.id = "aria-widget-frame";

    // Set this to your self-hosted widget folder URL
    iframe.src = "https://your-domain.com/widget/widget.html";

    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.width = "420px";
    iframe.style.height = "720px";
    iframe.style.border = "none";
    iframe.style.background = "transparent";
    iframe.style.zIndex = "999999";
    iframe.style.overflow = "hidden";

    iframe.allow = "clipboard-write";

    document.body.appendChild(iframe);

})();
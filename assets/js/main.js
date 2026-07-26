(function () {
  "use strict";

  var body = document.body;
  var menuButton = document.querySelector(".menu-toggle");
  var navigation = document.querySelector(".main-nav");
  var serviceButton = document.querySelector(".nav-dropdown > button");
  var servicePanel = document.querySelector(".dropdown-panel");
  var modal = document.querySelector("[data-booking-modal]");
  var modalForm = document.querySelector("[data-modal-form]");
  var modalSuccess = document.querySelector("[data-modal-success]");
  var cookieBanner = document.querySelector("[data-cookie-banner]");
  var lastFocusedElement = null;

  function setMenu(open) {
    if (!menuButton || !navigation) return;
    navigation.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Sulje valikko" : "Avaa valikko");
    if (!open) setServices(false);
  }

  function setServices(open) {
    if (!serviceButton || !servicePanel) return;
    servicePanel.classList.toggle("is-open", open);
    serviceButton.setAttribute("aria-expanded", String(open));
  }

  function resetModal() {
    if (modalForm) modalForm.classList.remove("is-hidden");
    if (modalSuccess) modalSuccess.classList.add("is-hidden");
    var form = modalForm && modalForm.querySelector("form");
    if (form) form.reset();
  }

  function openModal() {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    resetModal();
    modal.classList.remove("is-hidden");
    body.classList.add("modal-open");
    var firstInput = modal.querySelector("input");
    if (firstInput) window.setTimeout(function () { firstInput.focus(); }, 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("is-hidden");
    body.classList.remove("modal-open");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  if (menuButton) {
    menuButton.addEventListener("click", function () {
      setMenu(!navigation.classList.contains("is-open"));
    });
  }

  if (serviceButton) {
    serviceButton.addEventListener("click", function () {
      setServices(!servicePanel.classList.contains("is-open"));
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target;

    if (target.closest("[data-booking-open]")) {
      event.preventDefault();
      openModal();
      return;
    }

    if (target.closest("[data-booking-close]")) {
      closeModal();
      return;
    }

    if (
      servicePanel &&
      servicePanel.classList.contains("is-open") &&
      !target.closest(".nav-dropdown")
    ) {
      setServices(false);
    }
  });

  if (modal) {
    modal.addEventListener("mousedown", function (event) {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal && !modal.classList.contains("is-hidden")) {
      closeModal();
    }
  });

  document.querySelectorAll(".faq-item button").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      var list = item.closest(".faq-list");
      var wasOpen = item.classList.contains("is-open");

      list.querySelectorAll(".faq-item").forEach(function (row) {
        row.classList.remove("is-open");
        var rowButton = row.querySelector("button");
        var marker = rowButton.querySelector("span:last-child");
        rowButton.setAttribute("aria-expanded", "false");
        if (marker) marker.textContent = "+";
      });

      if (!wasOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        var marker = button.querySelector("span:last-child");
        if (marker) marker.textContent = "−";
      }
    });
  });

  document.querySelectorAll(".contact-form").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      if (form.closest("[data-booking-modal]")) {
        if (modalForm) modalForm.classList.add("is-hidden");
        if (modalSuccess) modalSuccess.classList.remove("is-hidden");
        return;
      }

      form.classList.add("is-hidden");
      var success = document.createElement("div");
      success.className = "form-success form-success--inline";
      success.innerHTML =
        '<svg aria-hidden="true" class="icon" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"></path></svg>' +
        "<h3>Viesti lähetetty</h3>" +
        "<p>Kiitos! Vastaamme yleensä yhden arkipäivän kuluessa.</p>";
      form.insertAdjacentElement("afterend", success);
    });
  });

  function saveCookieChoice(value) {
    try {
      window.localStorage.setItem("artendes-cookie-choice", value);
    } catch {
      // Local storage can be unavailable when files are opened in strict mode.
    }
    if (cookieBanner) cookieBanner.classList.add("is-hidden");
  }

  if (cookieBanner) {
    var cookieChoice = null;
    try {
      cookieChoice = window.localStorage.getItem("artendes-cookie-choice");
    } catch {
      cookieChoice = null;
    }
    if (cookieChoice === null) cookieBanner.classList.remove("is-hidden");

    cookieBanner.querySelectorAll("[data-cookie-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        saveCookieChoice(button.getAttribute("data-cookie-choice"));
      });
    });
  }

  var revealNodes = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach(function (node) { node.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealNodes.forEach(function (node) { observer.observe(node); });
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) setMenu(false);
  });
})();

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
  var customSelects = [];

  function setMenu(open) {
    if (!menuButton || !navigation) return;
    navigation.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Sulje valikko" : "Avaa valikko");
    if (!open) setServices(false);
  }

  function setServices(open) {
    if (!serviceButton || !servicePanel) return;
    servicePanel.classList.toggle("is-open", open);
    serviceButton.setAttribute("aria-expanded", String(open));

    if (open && window.innerWidth <= 900) {
      window.setTimeout(function () {
        serviceButton.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 60);
    }
  }

  function resetCustomSelects(scope) {
    customSelects.forEach(function (instance) {
      if (!scope || scope.contains(instance.select)) {
        instance.sync();
        instance.close();
      }
    });
  }

  function resetModal() {
    if (modalForm) modalForm.classList.remove("is-hidden");
    if (modalSuccess) modalSuccess.classList.add("is-hidden");
    var form = modalForm && modalForm.querySelector("form");
    if (form) {
      form.reset();
      window.setTimeout(function () { resetCustomSelects(form); }, 0);
    }
  }

  function openModal() {
    if (!modal) return;
    if (navigation && navigation.classList.contains("is-open")) setMenu(false);
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
    resetCustomSelects(modal);
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function closeAllCustomSelects(except) {
    customSelects.forEach(function (instance) {
      if (instance !== except) instance.close();
    });
  }

  function enhanceSelect(select, index) {
    if (select.dataset.customSelectReady === "true") return;
    select.dataset.customSelectReady = "true";
    select.classList.add("custom-select__native");

    var wrapper = document.createElement("div");
    wrapper.className = "custom-select";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "custom-select__button";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");

    var panel = document.createElement("div");
    panel.className = "custom-select__panel";
    panel.id = "custom-select-panel-" + index;
    panel.setAttribute("role", "listbox");
    button.setAttribute("aria-controls", panel.id);

    Array.prototype.forEach.call(select.options, function (option, optionIndex) {
      if (option.disabled && !option.value) return;
      var item = document.createElement("button");
      item.type = "button";
      item.className = "custom-select__option";
      item.setAttribute("role", "option");
      item.dataset.value = option.value;
      item.dataset.optionIndex = String(optionIndex);
      item.textContent = option.textContent;
      panel.appendChild(item);
    });

    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    wrapper.appendChild(button);
    wrapper.appendChild(panel);

    var instance = {
      select: select,
      wrapper: wrapper,
      button: button,
      panel: panel,
      open: function () {
        closeAllCustomSelects(instance);
        var boundary = wrapper.closest(".booking-modal");
        var boundaryBottom = boundary ? boundary.getBoundingClientRect().bottom : window.innerHeight;
        var buttonRect = button.getBoundingClientRect();
        var spaceBelow = boundaryBottom - buttonRect.bottom;
        wrapper.classList.remove("opens-up");
        panel.style.maxHeight = boundary
          ? Math.max(120, Math.min(270, spaceBelow - 12)) + "px"
          : "270px";
        wrapper.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        var selected = panel.querySelector(".is-selected") || panel.querySelector(".custom-select__option");
        if (selected) window.setTimeout(function () { selected.focus(); }, 0);
      },
      close: function () {
        wrapper.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
      },
      sync: function () {
        var selectedOption = select.options[select.selectedIndex];
        var placeholder = !select.value;
        button.textContent = selectedOption ? selectedOption.textContent : "Valitse";
        button.classList.toggle("is-placeholder", placeholder);
        panel.querySelectorAll(".custom-select__option").forEach(function (item) {
          var selected = item.dataset.value === select.value;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-selected", String(selected));
        });
      }
    };

    button.addEventListener("click", function () {
      if (wrapper.classList.contains("is-open")) instance.close();
      else instance.open();
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        instance.open();
      }
    });

    panel.addEventListener("click", function (event) {
      var item = event.target.closest(".custom-select__option");
      if (!item) return;
      select.selectedIndex = Number(item.dataset.optionIndex);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      wrapper.classList.remove("is-invalid");
      instance.sync();
      instance.close();
      button.focus();
    });

    panel.addEventListener("keydown", function (event) {
      var options = Array.prototype.slice.call(panel.querySelectorAll(".custom-select__option"));
      var current = options.indexOf(document.activeElement);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        options[Math.min(current + 1, options.length - 1)].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        options[Math.max(current - 1, 0)].focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        instance.close();
        button.focus();
      } else if (event.key === "Tab") {
        instance.close();
      }
    });

    select.addEventListener("change", instance.sync);
    instance.sync();
    customSelects.push(instance);
  }

  function initCustomSelects() {
    document.querySelectorAll(".contact-form select").forEach(function (select, index) {
      enhanceSelect(select, index + 1);
    });
  }

  function getSliderVisibleCount() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function initContentSlider(grid, sliderIndex) {
    var cards = Array.prototype.slice.call(grid.children);
    if (cards.length <= 3) return;

    grid.classList.add("has-slider");
    grid.setAttribute("role", "region");
    grid.setAttribute("aria-roledescription", "carousel");

    var viewport = document.createElement("div");
    viewport.className = "content-slider__viewport";

    var track = document.createElement("div");
    track.className = "content-slider__track";
    track.id = "content-slider-track-" + sliderIndex;

    cards.forEach(function (card, cardIndex) {
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", (cardIndex + 1) + " / " + cards.length);
      track.appendChild(card);
    });

    viewport.appendChild(track);
    grid.appendChild(viewport);

    var controls = document.createElement("div");
    controls.className = "content-slider__controls";

    var previous = document.createElement("button");
    previous.type = "button";
    previous.className = "content-slider__arrow content-slider__arrow--prev";
    previous.setAttribute("aria-label", "Edellinen");
    previous.setAttribute("aria-controls", track.id);
    previous.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7-7 7 7 7"></path></svg>';

    var dots = document.createElement("div");
    dots.className = "content-slider__dots";

    var next = document.createElement("button");
    next.type = "button";
    next.className = "content-slider__arrow content-slider__arrow--next";
    next.setAttribute("aria-label", "Seuraava");
    next.setAttribute("aria-controls", track.id);
    next.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"></path></svg>';

    controls.appendChild(previous);
    controls.appendChild(dots);
    controls.appendChild(next);
    grid.appendChild(controls);

    var state = { index: 0, maxIndex: 0 };

    function rebuildDots() {
      dots.innerHTML = "";
      for (var i = 0; i <= state.maxIndex; i += 1) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "content-slider__dot";
        dot.setAttribute("aria-label", "Siirry kohtaan " + (i + 1));
        dot.dataset.index = String(i);
        dots.appendChild(dot);
      }
    }

    function render() {
      var target = cards[state.index];
      var offset = target ? target.offsetLeft : 0;
      track.style.transform = "translate3d(" + (-offset) + "px,0,0)";
      previous.disabled = state.index === 0;
      next.disabled = state.index === state.maxIndex;
      dots.querySelectorAll(".content-slider__dot").forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === state.index);
        dot.setAttribute("aria-current", dotIndex === state.index ? "true" : "false");
      });
    }

    function updateDimensions() {
      var visible = getSliderVisibleCount();
      state.maxIndex = Math.max(0, cards.length - visible);
      if (state.index > state.maxIndex) state.index = state.maxIndex;
      rebuildDots();
      render();
    }

    previous.addEventListener("click", function () {
      state.index = Math.max(0, state.index - 1);
      render();
    });

    next.addEventListener("click", function () {
      state.index = Math.min(state.maxIndex, state.index + 1);
      render();
    });

    dots.addEventListener("click", function (event) {
      var dot = event.target.closest(".content-slider__dot");
      if (!dot) return;
      state.index = Number(dot.dataset.index);
      render();
    });

    var touchStartX = 0;
    viewport.addEventListener("touchstart", function (event) {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener("touchend", function (event) {
      var distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) < 45) return;
      if (distance < 0) state.index = Math.min(state.maxIndex, state.index + 1);
      else state.index = Math.max(0, state.index - 1);
      render();
    }, { passive: true });

    window.addEventListener("resize", updateDimensions);
    updateDimensions();
  }

  function initContentSliders() {
    document.querySelectorAll(".before-grid, .review-grid").forEach(function (grid, index) {
      initContentSlider(grid, index + 1);
    });
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

    if (!target.closest(".custom-select")) closeAllCustomSelects();
  });

  if (modal) {
    modal.addEventListener("mousedown", function (event) {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAllCustomSelects();
      if (modal && !modal.classList.contains("is-hidden")) closeModal();
      else if (navigation && navigation.classList.contains("is-open")) setMenu(false);
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
    form.addEventListener("reset", function () {
      window.setTimeout(function () { resetCustomSelects(form); }, 0);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var invalidSelect = form.querySelector("select:invalid");
      if (invalidSelect) {
        var selectInstance = customSelects.find(function (instance) { return instance.select === invalidSelect; });
        if (selectInstance) {
          selectInstance.wrapper.classList.add("is-invalid");
          selectInstance.button.focus();
          selectInstance.open();
          return;
        }
      }
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
    } catch (error) {
      // Local storage can be unavailable when files are opened in strict mode.
    }
    if (cookieBanner) cookieBanner.classList.add("is-hidden");
  }

  if (cookieBanner) {
    var cookieChoice = null;
    try {
      cookieChoice = window.localStorage.getItem("artendes-cookie-choice");
    } catch (error) {
      cookieChoice = null;
    }
    if (cookieChoice === null) cookieBanner.classList.remove("is-hidden");

    cookieBanner.querySelectorAll("[data-cookie-choice]").forEach(function (button) {
      button.addEventListener("click", function () {
        saveCookieChoice(button.getAttribute("data-cookie-choice"));
      });
    });
  }

  initCustomSelects();
  initContentSliders();

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

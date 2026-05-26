document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const header = document.getElementById("header");
  const nav = document.getElementById("nav");
  const menuToggle = document.getElementById("menuToggle");
  const backToTop = document.getElementById("backToTop");
  const revealElements = document.querySelectorAll(".reveal");
  const faqItems = document.querySelectorAll(".faq-item");
  const navLinks = document.querySelectorAll(".nav a");

  const closeMenu = () => {
    nav?.classList.remove("active");
    menuToggle?.classList.remove("active");
    header?.classList.remove("menu-active");
    document.body.classList.remove("menu-open");

    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menu");
  };

  const openMenu = () => {
    nav?.classList.add("active");
    menuToggle?.classList.add("active");
    header?.classList.add("menu-active");
    document.body.classList.add("menu-open");

    menuToggle?.setAttribute("aria-expanded", "true");
    menuToggle?.setAttribute("aria-label", "Fechar menu");
  };

  const toggleMenu = () => {
    const isOpen = nav?.classList.contains("active");

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;

    header?.classList.toggle("scrolled", scrollY > 24);
    backToTop?.classList.toggle("show", scrollY > 640);
  };

  const setupLoader = () => {
    if (!loader) return;

    window.setTimeout(() => {
      loader.classList.add("hide");
    }, 420);
  };

  const setupReveal = () => {
    if (!revealElements.length) return;

    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((element) => {
        element.classList.add("visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -56px 0px",
      },
    );

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(element);
    });
  };

  const setupFaq = () => {
    if (!faqItems.length) return;

    const closeFaqItem = (item) => {
      const button = item.querySelector("button");
      const content = item.querySelector(".faq-item__content");

      item.classList.remove("active");
      button?.setAttribute("aria-expanded", "false");

      if (content) {
        content.style.maxHeight = "0px";
      }
    };

    const openFaqItem = (item) => {
      const button = item.querySelector("button");
      const content = item.querySelector(".faq-item__content");

      item.classList.add("active");
      button?.setAttribute("aria-expanded", "true");

      if (content) {
        content.style.maxHeight = `${content.scrollHeight}px`;
      }
    };

    faqItems.forEach((item) => {
      const button = item.querySelector("button");
      const content = item.querySelector(".faq-item__content");

      if (!button || !content) return;

      closeFaqItem(item);

      button.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        faqItems.forEach((faqItem) => {
          if (faqItem !== item) {
            closeFaqItem(faqItem);
          }
        });

        if (isActive) {
          closeFaqItem(item);
        } else {
          openFaqItem(item);
        }
      });
    });

    window.addEventListener(
      "resize",
      () => {
        faqItems.forEach((item) => {
          const content = item.querySelector(".faq-item__content");

          if (item.classList.contains("active") && content) {
            content.style.maxHeight = `${content.scrollHeight}px`;
          }
        });
      },
      { passive: true },
    );
  };

  const setupMenu = () => {
    menuToggle?.addEventListener("click", toggleMenu);

    navLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth > 960) {
          closeMenu();
        }
      },
      { passive: true },
    );
  };

  const setupBackToTop = () => {
    backToTop?.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  };

  setupLoader();
  setupReveal();
  setupFaq();
  setupMenu();
  setupBackToTop();
  handleScroll();

  window.addEventListener("scroll", handleScroll, { passive: true });
});

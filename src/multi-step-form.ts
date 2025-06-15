import { getGsap, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

const initMultiStepForm = () => {
  const [gsap] = getGsap();

  if (!gsap) return;

  const forms = getMultipleHtmlElements({ selector: "form[data-calculator-form]" });

  if (!forms) return;

  for (const form of forms) {
    const step1Element = getHtmlElement({
      selector: '[data-form-step="1"]',
      parent: form,
      log: "error",
    });
    const step2Element = getHtmlElement({
      selector: '[data-form-step="2"]',
      parent: form,
      log: "error",
    });
    const nextButton = getHtmlElement({
      selector: "[data-next-button]",
      parent: form,
      log: "error",
    });
    const prevButton = getHtmlElement({
      selector: "[data-prev-button]",
      parent: form,
      log: "error",
    });

    if (!step1Element || !step2Element || !nextButton || !prevButton) continue;

    const addressInputElement = getHtmlElement<HTMLInputElement>({
      selector: "input[data-address-input]",
      parent: form,
      log: "error",
    });
    const bedroomsSelectElement = getHtmlElement<HTMLSelectElement>({
      selector: 'select[name="bedrooms"]',
      parent: form,
      log: "error",
    });

    if (!addressInputElement || !bedroomsSelectElement) continue;

    const animateNext = async () => {
      gsap.to(step1Element, { opacity: 0, xPercent: -102, duration: 0.6, ease: "power1.inOut" });

      gsap.fromTo(
        step2Element,
        { opacity: 0, xPercent: 0 },
        {
          opacity: 1,
          xPercent: -100,
          duration: 0.6,
          ease: "power1.inOut",
        }
      );
    };

    const animatePrev = async () => {
      gsap.fromTo(
        step1Element,
        { opacity: 0, xPercent: -100 },
        {
          opacity: 1,
          xPercent: 0,
          duration: 0.6,
          ease: "power1.inOut",
        }
      );

      gsap.fromTo(
        step2Element,
        { opacity: 1, xPercent: -100 },
        {
          opacity: 0,
          xPercent: 0,
          duration: 0.6,
          ease: "power1.inOut",
        }
      );
    };

    nextButton.addEventListener("click", () => {
      for (const inputEl of [addressInputElement, bedroomsSelectElement]) {
        if (inputEl.checkValidity()) continue;
        inputEl.reportValidity();
        return;
      }

      animateNext();
    });

    prevButton.addEventListener("click", () => {
      animatePrev();
    });
  }
};

initMultiStepForm();

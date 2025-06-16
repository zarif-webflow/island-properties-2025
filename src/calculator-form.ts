import { getGsap, getHtmlElement, getMultipleHtmlElements } from "@taj-wf/utils";

const makeAllInputElementsUnfocusable = (parent: HTMLElement) => {
  const allInputElements = getMultipleHtmlElements({ selector: "input, select, textarea", parent });
  if (!allInputElements) return;
  for (const inputElement of allInputElements) {
    inputElement.setAttribute("tabindex", "-1");
  }
};

const makeAllInputElementsFocusable = (parent: HTMLElement) => {
  const allInputElements = getMultipleHtmlElements({ selector: "input, select, textarea", parent });
  if (!allInputElements) return;
  for (const inputElement of allInputElements) {
    inputElement.removeAttribute("tabindex");
  }
};

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

    nextButton.setAttribute("type", "button");
    prevButton.setAttribute("type", "button");

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
      gsap.set(step1Element, { opacity: 1, xPercent: 0 });
      gsap.set(step2Element, { opacity: 0, xPercent: 102 });
      gsap.to(step1Element, {
        opacity: 0,
        xPercent: -102,
        duration: 0.4,
        ease: "power1.out",
        onComplete: () => {
          step1Element.classList.add("is--hidden");
          step2Element.classList.remove("is--hidden");
          gsap.to(step2Element, { opacity: 1, xPercent: 0, duration: 0.4, ease: "power1.out" });
        },
      });
    };

    const animatePrev = async () => {
      gsap.set(step2Element, { opacity: 1, xPercent: 0 });
      gsap.set(step1Element, { opacity: 0, xPercent: -102 });
      gsap.to(step2Element, {
        opacity: 0,
        xPercent: 102,
        duration: 0.3,
        ease: "power1.out",
        onComplete: () => {
          step2Element.classList.add("is--hidden");
          step1Element.classList.remove("is--hidden");
          gsap.to(step1Element, { opacity: 1, xPercent: 0, duration: 0.3, ease: "power1.out" });
        },
      });
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

    makeAllInputElementsFocusable(step1Element);
    makeAllInputElementsUnfocusable(step2Element);
  }
};

initMultiStepForm();

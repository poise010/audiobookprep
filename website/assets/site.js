import {
  plans,
  number,
  recommendPlan,
  planPrice,
  annualSaving,
} from "./pricing.js";

const root = document.querySelector(".abp-site");
root.classList.add("has-js");
document.addEventListener("keydown", () =>
  root.classList.add("keyboard-input"),
);
document.addEventListener("pointerdown", () =>
  root.classList.remove("keyboard-input"),
);
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-navigation");
if (menuButton && navigation) {
  menuButton.hidden = false;
  const closeMenu = () => {
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("is-open")) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  matchMedia("(min-width:601px)").addEventListener("change", closeMenu);
}

// Authored, fictional examples only. These do not connect to or simulate an AI service.
const guidePanel = document.querySelector("#guide-panel");
const initialCharacters = guidePanel?.innerHTML;
const examples = {
  characters: { label: "Characters", html: initialCharacters },
  chapters: {
    label: "Chapter briefs",
    html: `<div class="guide-heading"><div><span class="guide-overline">THE LAST LIGHT</span><h3>The story, scene by scene.</h3></div><span class="guide-count">Sample chapters</span></div><div class="chapter-entry"><b>01</b><div><h4>The return</h4><p>Mara arrives in the town she left seven years ago. Familiar streets bring back a history she is reluctant to revisit.</p></div></div><div class="chapter-entry"><b>04</b><div><h4>The things we leave unsaid</h4><p>A light in the abandoned lighthouse brings Mara to the quay. Elias is waiting. Their reunion leaves the central question unspoken.</p></div></div><div class="chapter-entry"><b>05</b><div><h4>North by memory</h4><p>The astrolabe points Mara toward an old promise. Her investigation becomes personal.</p></div></div><p class="guide-caution">Fictional story outline created to illustrate the planned guide format.</p>`,
  },
  pronunciations: {
    label: "Pronunciation research",
    html: `<div class="guide-heading"><div><span class="guide-overline">THE LAST LIGHT</span><h3>A few words to check.</h3></div><span class="guide-count">03 research notes</span></div><table class="pronunciation-table"><thead><tr><th scope="col">Word</th><th scope="col">Starting point</th><th scope="col">Context</th></tr></thead><tbody><tr><td><strong>astrolabe</strong></td><td>AS-truh-layb</td><td>Navigation instrument · Ch. 04</td></tr><tr><td><strong>quay</strong></td><td>KEE</td><td>Harbor setting · Ch. 04</td></tr><tr><td><strong>Mara Voss</strong></td><td>Confirm with author</td><td>Character name · Ch. 01</td></tr></tbody></table><p class="guide-caution">Research notes are a starting point. Check a trusted pronunciation source, regional usage, and the author’s preference before recording.</p>`,
  },
};
document.querySelectorAll("[data-feature]").forEach((button) => {
  button.addEventListener("click", () => {
    const example = examples[button.dataset.feature];
    document.querySelectorAll("[data-feature]").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    // Only developer-authored static templates are inserted, never user input.
    guidePanel.innerHTML = example.html;
    document.querySelector("#guide-breadcrumb-current").textContent =
      example.label;
  });
});

let billing = "monthly";
const wordsInput = document.querySelector("#monthly-words");
const result = document.querySelector("#calculator-result");
function updateEstimate() {
  if (!wordsInput || !result) return;
  const words = wordsInput.valueAsNumber;
  if (
    !wordsInput.value ||
    !Number.isFinite(words) ||
    words < 1000 ||
    words > 10000000 ||
    !Number.isInteger(words)
  ) {
    wordsInput.setAttribute("aria-invalid", "true");
    result.replaceChildren();
    const message = document.createElement("strong");
    message.textContent = "Enter 1,000–10,000,000 words.";
    result.append(message);
    return;
  }
  wordsInput.removeAttribute("aria-invalid");
  const plan = recommendPlan(words);
  result.replaceChildren();
  const label = document.createElement("span");
  const title = document.createElement("strong");
  const detail = document.createElement("small");
  label.textContent = plan
    ? "Your suggested plan"
    : "A bigger production slate";
  if (plan) {
    title.textContent = plan.name;
    const price = document.createElement("span");
    price.textContent = ` · $${planPrice(plan, billing)} / month`;
    title.append(price);
    detail.textContent =
      billing === "annual"
        ? `$${plan.annualMonthly * 12} billed yearly · ${number.format(plan.words - words)} words to spare / month`
        : `${number.format(plan.words - words)} words of room to grow`;
  } else {
    title.textContent = "Beyond the current plans";
    detail.textContent = "Higher-volume options are still being defined.";
  }
  result.append(label, title, detail);
}
document.querySelectorAll("[data-billing]").forEach((button) => {
  button.addEventListener("click", () => {
    billing = button.dataset.billing;
    document.querySelectorAll("[data-billing]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    plans.forEach((plan) => {
      document.querySelector(`[data-price="${plan.id}"]`).textContent =
        `$${planPrice(plan, billing)}`;
      document.querySelector(`[data-billing-detail="${plan.id}"]`).textContent =
        billing === "annual"
          ? `$${plan.annualMonthly * 12} billed yearly · save $${annualSaving(plan)}`
          : `$${plan.monthly} billed monthly`;
    });
    updateEstimate();
  });
});
wordsInput?.addEventListener("input", updateEstimate);
wordsInput?.addEventListener("change", updateEstimate);
wordsInput?.addEventListener("blur", updateEstimate);
if (wordsInput)
  wordsInput.setAttribute("aria-describedby", "calculator-result");

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog
    .querySelector("[data-close-dialog]")
    ?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
  });
});
function openDialog(dialog) {
  dialog.showModal();
  document.body.style.overflow = "hidden";
}
document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = plans.find((item) => item.id === button.dataset.plan);
    const container = document.querySelector("#dialog-plan-content");
    container.replaceChildren();
    const box = document.createElement("div");
    box.className = "dialog-plan";
    const name = document.createElement("strong");
    name.textContent = `${plan.name} · $${planPrice(plan, billing)} / month`;
    const capacity = document.createElement("p");
    capacity.textContent = `${number.format(plan.words)} words per month · ${plan.seats} ${plan.seats === 1 ? "seat" : "seats"}`;
    const terms = document.createElement("p");
    terms.textContent =
      billing === "annual"
        ? `$${plan.annualMonthly * 12} billed yearly. Allowance resets monthly.`
        : `$${plan.monthly} billed monthly. Allowance resets monthly.`;
    box.append(name, capacity, terms);
    container.append(box);
    openDialog(document.querySelector("#plan-dialog"));
  });
});
document
  .querySelectorAll("[data-open-privacy]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      openDialog(document.querySelector("#privacy-dialog")),
    ),
  );

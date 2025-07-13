// Smooth scrolling utility for anchor links
export function smoothScrollTo(targetId, offset = 80) {
  const target = document.getElementById(targetId);
  if (target) {
    const targetPosition = target.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  }
}

// Handle all anchor link clicks
export function setupSmoothScrolling() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link && link.hash && link.origin === window.location.origin) {
      e.preventDefault();
      const targetId = link.hash.slice(1); // Remove the #
      smoothScrollTo(targetId);
    }
  });
}

// Scroll to element with animation
export function scrollToElement(element, offset = 80) {
  if (element) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  }
}

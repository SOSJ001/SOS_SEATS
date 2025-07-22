<script lang="ts">
  import { onMount } from "svelte";
  import { activeSectionStore } from "$lib/store";
  import { page } from "$app/stores";

  // Sections to observe
  const sections = [
    { id: "home", threshold: 0.3 },
    { id: "features", threshold: 0.3 },
    { id: "how-it-works", threshold: 0.3 },
    { id: "pricing", threshold: 0.3 },
    { id: "team", threshold: 0.3 },
  ];

  let observers: IntersectionObserver[] = [];
  let currentPath = "";

  onMount(() => {
    // Get initial path immediately
    currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    // Handle initial route immediately
    if (currentPath === "/marketplace") {
      activeSectionStore.set("marketplace");
    } else if (currentPath === "/dashboard") {
      activeSectionStore.set("dashboard");
    } else if (currentPath === "/") {
      setupSectionObservers();

      // Handle hash-based navigation
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1); // Remove the #
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            activeSectionStore.set(hash);
          }
        }, 100); // Small delay to ensure page is loaded
      }
    } else {
      activeSectionStore.set("");
    }

    // Subscribe to page changes
    const unsubscribe = page.subscribe(($page) => {
      const newPath = $page.url.pathname;

      // If path changed, clean up existing observers
      if (currentPath !== newPath) {
        observers.forEach((observer) => observer.disconnect());
        observers = [];
        currentPath = newPath;
      }

      // Handle different routes
      if (newPath === "/marketplace") {
        activeSectionStore.set("marketplace");
      } else if (newPath === "/dashboard") {
        activeSectionStore.set("dashboard");
      } else if (newPath === "/") {
        // Set up observers for home page sections
        setupSectionObservers();

        // Handle hash-based navigation for route changes
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.substring(1);
          setTimeout(() => {
            const element = document.getElementById(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
              activeSectionStore.set(hash);
            }
          }, 100);
        }
      } else {
        // For other routes, clear active section
        activeSectionStore.set("");
      }
    });

    // Cleanup function
    return () => {
      observers.forEach((observer) => observer.disconnect());
      unsubscribe();
    };
  });

  function setupSectionObservers() {
    // Create intersection observers for each section
    sections.forEach(({ id, threshold }) => {
      const element = document.getElementById(id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                activeSectionStore.set(id);
              }
            });
          },
          {
            threshold: threshold,
            rootMargin: "-20% 0px -20% 0px", // Adjust when section is considered "active"
          }
        );

        observer.observe(element);
        observers.push(observer);
      }
    });
  }
</script>

<!-- This component doesn't render anything, it just observes -->

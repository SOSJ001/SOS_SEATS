<script>
  export let members = [
    {
      name: "Jennifer E.K Kargbo",
      role: "Lead writer with over 7 years of experience in content creation, writing and literature",
      image: "",
      alt: "Team Member 1",
    },
    {
      name: "Amara D. James",
      role: "Product Manager with a knack for user experience design and project management in tech startups.",
      image: "",
      alt: "Team Member 2",
    },
    {
      name: "Michael S.O.S Johnson",
      role: "Lead Developer with over 5 years of experience in web development/software development.",
      image: "",
      alt: "Team Member 3",
    },
  ];
</script>

<section class="py-8 bg-gradient-to-b from-[#18122B] to-[#232946]" id="aboutUs">
  <div class="container mx-auto px-4">
    <h2
      class="text-3xl font-extrabold text-center mb-12 bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#FF6B6B] bg-clip-text text-transparent drop-shadow-lg"
    >
      Meet the Team
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each members as member}
        <div
          class="flex flex-col items-center p-6 bg-gradient-to-br from-[#18122B] via-[#232946] to-[#0A0A0A] rounded-lg shadow-lg border border-[#9D4EDD]/30"
        >
          <img
            src={member.image}
            alt={member.alt}
            class="w-32 h-32 mb-4 rounded-full object-cover border-4 border-[#00F5FF]/40 shadow-lg"
          />
          <h3 class="text-xl font-semibold mb-2 text-gray-100">
            {member.name}
          </h3>
          <p class="text-gray-300 text-center">
            {member.role}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>

<script>
  import { Button } from 'flowbite-svelte';
  import explosion from "../assets/explosion.png";
  import { AnimatedHeadline } from "svelte-animated-headline";
</script>

<div class="h-screen w-screen bg-black">
  <div class="banner">
    <img
      class="h-screen max-w-full rounded-lg fallback-image"
      src={explosion}
      alt="banner"
    />
  </div>
  <div id="content">
    <div class="text-yellow-300">
      <AnimatedHeadline
        texts={["create", "get"]}
        y={0}
        wait={0}
        slide={100}
        fade={3000}
      />
    </div>
    <div class="text-white">YOUR TICKET FOR</div>
    <div class="text-yellow-300">
      <AnimatedHeadline
        texts={[
          "Sport",
          "Wedding",
          "Birthday",
          "conference",
          "Pool Party",
          "House Party",
          "+ more Event",
        ]}
        y={20}
        wait={0}
        slide={500}
        fade={1500}
      />
    </div>
    <p id="small">
      Safe, secure, reliable ticketing. Your <span
        class="text-yellow-300"><AnimatedHeadline
          texts={["ticket", "invitation"]}
          y={-20}
          wait={0}
          slide={100}
          fade={2000}
        /></span
      > <br>to live satisfying entertainment!
    </p>
    <div class="Button">
    <Button size="xl" class="bg-white text-gray-800 hover:bg-yellow-400 hover:text-white hover:outline-none">Learn More</Button>
  </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Alkatra:wght@600&display=swap");

  /* #all{
    position: relative;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;

  } */
  .banner {
    opacity: 0.3;
  }
  .fallback-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
  }

  #content {
    font-family: "Alkatra", cursive;
    font-size: 60px;
    text-transform: uppercase;
    z-index: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 80%;
    overflow: hidden;
    margin-top: 70px;
    
  }

  #content .Button{
    font-size: 16px;
  }
  #small {
    font-size: 20px;
    text-transform: capitalize;
  }

  @media (max-width: 662px) {
    #content {
      font-size: 40px;
      margin-top: 0px;
    }
  }
</style>

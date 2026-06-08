import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import ClientFeedback from "@/components/ui/testimonial";

export default function Home() {
  return (
    <div className="overflow-x-hidden w-full min-h-screen">
      <CinematicHero dashboardHref="/dashboard" />
      <ClientFeedback />
    </div>
  );
}

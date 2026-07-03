import {
  AboutSection,
  ContactSection,
  GroupsSection,
  HeroSection,
  MissionSection,
  ModulesSection,
} from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <MissionSection />
      <ModulesSection />
      <GroupsSection />
      <ContactSection />
    </>
  );
}

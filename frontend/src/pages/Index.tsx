import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AirdropSection from "@/components/AirdropSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <AirdropSection />
      </main>
    </div>
  );
};

export default Index;

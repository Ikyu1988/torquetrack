import { Button } from "../components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { AppLogo } from "../components/layout/AppLogo";
import { ArrowRight, Settings, Users, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-card">
      <header className="p-4 sm:p-6 flex justify-between items-center">
        <AppLogo />
        <Button asChild variant="outline">
          <Link href="/login">Login</Link>
        </Button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <section className="py-12 md:py-24">
          <div className="container mx-auto">
            <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
              Power Up Your Workshop
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              TorqueTrack is the all-in-one solution for motorcycle shops. Streamline job orders, manage inventory, track mechanics, and boost your efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 group">
                <Link href="/login">
                  Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="text-lg px-8 py-6">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-card w-full">
          <div className="container mx-auto px-4">
            <h2 className="font-headline text-4xl md:text-5xl font-semibold mb-16 text-center">Why TorqueTrack?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-primary" />}
                title="Streamlined Operations"
                description="Manage job orders, customer data, and motorcycle details effortlessly from a unified dashboard."
              />
              <FeatureCard
                icon={<Settings className="h-10 w-10 text-primary" />}
                title="Inventory Precision"
                description="Real-time stock tracking, part management, and low stock alerts to keep your inventory optimized."
              />
              <FeatureCard
                icon={<Users className="h-10 w-10 text-primary" />}
                title="Mechanic Management"
                description="Assign tasks, track commissions, and monitor performance for each mechanic in your team."
              />
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24 w-full">
          <div className="container mx-auto px-4">
            <div className="bg-primary/10 p-8 md:p-12 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2 text-left">
                <h2 className="font-headline text-3xl md:text-4xl font-semibold mb-4">Ready to Shift Gears?</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Join TorqueTrack today and experience the future of motorcycle shop management.
                  Focus on what you do best – fixing bikes – and let us handle the rest.
                </p>
                <Button asChild size="lg" className="text-lg px-8 py-6 group">
                  <Link href="/login">
                    Start Your Engine <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <Image 
                  src="https://picsum.photos/seed/1/500/400"
                  alt="Motorcycle shop illustration" 
                  width={500} 
                  height={400} 
                  className="rounded-lg shadow-md"
                  data-ai-hint="motorcycle workshop" 
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center p-6 border-t border-border">
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} TorqueTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-background p-8 rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 text-left">
      <div className="mb-6 flex justify-center md:justify-start">{icon}</div>
      <h3 className="font-headline text-2xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

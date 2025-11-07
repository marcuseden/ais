import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, Bell, MapPin, Shield } from 'lucide-react';

async function getMarketingCopy() {
  // Try to generate with OpenAI, fallback to static
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a concise marketing copywriter. Generate minimal, trustworthy copy for a maritime tech app.',
          },
          {
            role: 'user',
            content: 'Write a one-sentence hero headline and 3 brief feature bullet points (10 words max each) for an AIS vessel tracking app that monitors the Baltic Sea and sends alerts when ships enter the region.',
          },
        ],
        max_tokens: 150,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const lines = response.split('\n').filter(l => l.trim());
        return {
          headline: lines[0] || 'Track Baltic Sea vessels in real-time',
          features: lines.slice(1, 4).map(l => l.replace(/^[-•*]\s*/, '')),
        };
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }

  // Fallback static copy
  return {
    headline: 'Track Baltic Sea vessels in real-time',
    features: [
      'Live AIS data from the Baltic Sea region',
      'Custom geofence alerts when vessels enter zones',
      'Mobile-first interface with instant notifications',
    ],
  };
}

export default async function HomePage() {
  const { headline, features } = await getMarketingCopy();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Ship className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            {headline}
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Monitor vessel traffic across the Baltic Sea with real-time AIS data. 
            Set up custom alerts and never miss important maritime activity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/login">
                Get Started
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/app/map">
                View Live Map
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => {
            const icons = [MapPin, Bell, Shield];
            const Icon = icons[idx] || Ship;
            
            return (
              <Card key={idx}>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Privacy Note */}
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Privacy First</CardTitle>
            <CardDescription>
              We only use publicly available AIS data. No personal information is collected 
              or stored without explicit consent. All vessel tracking complies with maritime 
              regulations and GDPR requirements.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} AIS Alert. Built with Next.js, Supabase, and OpenStreetMap.</p>
        <p className="mt-2">
          Data provided by AISStream. Map tiles © OpenStreetMap contributors.
        </p>
      </footer>
    </div>
  );
}


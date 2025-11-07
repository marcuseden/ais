"use client"

import { useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ScrapeAllButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleScrapeAll = async () => {
    setLoading(true);
    
    toast({
      title: 'Scraping started',
      description: 'Enriching data for all vessels. This may take a few minutes...',
    });

    try {
      const response = await fetch('/api/scrape-all-vessels');
      const data = await response.json();

      toast({
        title: 'Scraping completed!',
        description: `${data.scraped} vessels scraped, ${data.cached} from cache, ${data.failed} failed`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to scrape vessels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleScrapeAll}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Enriching...' : 'Enrich All Vessels'}
    </Button>
  );
}


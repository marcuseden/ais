"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Ship, Building, Mail, Phone, Globe, MessageCircle, Navigation, Gauge, MapPin, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { MapView } from '@/components/map/MapView';

interface VesselData {
  mmsi: number;
  name?: string;
  ship_type?: string;
  last_lat?: number;
  last_lng?: number;
  sog?: number;
  cog?: number;
  last_seen: string;
}

interface RegistryData {
  found: boolean;
  imoNumber?: number;
  registeredOwner?: string;
  operatorName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  flagCountry?: string;
  vesselType?: string;
  grossTonnage?: number;
  lengthMeters?: number;
  yearBuilt?: number;
  dataQualityScore?: number;
  dataSources?: string[];
}

interface ChatData {
  chat: any;
  messages: any[];
}

export default function VesselPage() {
  const params = useParams();
  const router = useRouter();
  const mmsi = params.mmsi as string;
  const { toast } = useToast();

  const [vessel, setVessel] = useState<VesselData | null>(null);
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadVesselData();
    loadRegistryData();
    loadChat();
  }, [mmsi]);

  const loadVesselData = async () => {
    try {
      const response = await fetch('/api/vessels');
      const data = await response.json();
      const vesselData = data.vessels.find((v: any) => v.mmsi.toString() === mmsi);
      if (vesselData) {
        setVessel({
          mmsi: vesselData.mmsi,
          name: vesselData.name,
          ship_type: vesselData.ship_type,
          last_lat: vesselData.lat,
          last_lng: vesselData.lng,
          sog: vesselData.sog,
          cog: vesselData.cog,
          last_seen: vesselData.ts,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load vessel:', error);
      setLoading(false);
    }
  };

  const loadRegistryData = async () => {
    try {
      const response = await fetch(`/api/vessel-lookup/${mmsi}`);
      const data = await response.json();
      setRegistry(data);
    } catch (error) {
      console.error('Failed to load registry:', error);
    }
  };

  const loadChat = async () => {
    try {
      const response = await fetch(`/api/vessel-chat/${mmsi}`);
      if (response.ok) {
        const data = await response.json();
        setChatData(data);
      } else {
        // Chat tables might not exist yet - that's ok
        console.log('Chat system not yet configured');
        setChatData({ chat: null, messages: [] });
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
      setChatData({ chat: null, messages: [] });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatData?.chat) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/vessel-chat/${mmsi}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatData.chat.id,
          message: newMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      setNewMessage('');
      await loadChat();

      toast({
        title: 'Message sent',
        description: 'Logged for manual delivery',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Ship className="h-12 w-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (!vessel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Ship className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Vessel not found</p>
          <Button onClick={() => router.push('/app/map')} className="mt-4">
            Back to Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/app/map')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{vessel.name || `MMSI ${vessel.mmsi}`}</h1>
              <p className="text-sm text-muted-foreground">{vessel.ship_type || 'Unknown Type'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
        {/* Map showing vessel position */}
        {vessel.last_lat && vessel.last_lng && (
          <Card className="overflow-hidden">
            <div className="h-[300px] w-full">
              <MapView
                vessels={[{
                  mmsi: vessel.mmsi,
                  name: vessel.name,
                  ship_type: vessel.ship_type,
                  lat: vessel.last_lat,
                  lng: vessel.last_lng,
                  sog: vessel.sog,
                  cog: vessel.cog,
                  ts: vessel.last_seen,
                }]}
                center={[vessel.last_lat, vessel.last_lng]}
                zoom={12}
              />
            </div>
          </Card>
        )}

        {/* Current Position */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {vessel.last_lat && vessel.last_lng && (
                <div>
                  <div className="text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </div>
                  <div className="font-medium">{vessel.last_lat.toFixed(4)}, {vessel.last_lng.toFixed(4)}</div>
                </div>
              )}
              {vessel.sog !== undefined && (
                <div>
                  <div className="text-muted-foreground flex items-center gap-1 mb-1">
                    <Gauge className="h-3 w-3" />
                    Speed
                  </div>
                  <div className="font-medium">{vessel.sog.toFixed(1)} knots</div>
                </div>
              )}
              {vessel.cog !== undefined && (
                <div>
                  <div className="text-muted-foreground flex items-center gap-1 mb-1">
                    <Navigation className="h-3 w-3" />
                    Course
                  </div>
                  <div className="font-medium">{vessel.cog.toFixed(0)}°</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground mb-1">Last Seen</div>
                <div className="font-medium">{formatDistanceToNow(new Date(vessel.last_seen), { addSuffix: true })}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vessel Registry Data */}
        {registry?.found ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Owner & Operator
              </CardTitle>
              <CardDescription>
                Data from {registry.dataSources?.join(', ')} • Quality: {registry.dataQualityScore}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vessel Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {registry.imoNumber && (
                  <div>
                    <div className="text-muted-foreground">IMO Number</div>
                    <div className="font-medium">{registry.imoNumber}</div>
                  </div>
                )}
                {registry.flagCountry && (
                  <div>
                    <div className="text-muted-foreground">Flag</div>
                    <div className="font-medium">{registry.flagCountry}</div>
                  </div>
                )}
                {registry.yearBuilt && (
                  <div>
                    <div className="text-muted-foreground">Year Built</div>
                    <div className="font-medium">{registry.yearBuilt}</div>
                  </div>
                )}
                {registry.grossTonnage && (
                  <div>
                    <div className="text-muted-foreground">Gross Tonnage</div>
                    <div className="font-medium">{registry.grossTonnage.toLocaleString()} GT</div>
                  </div>
                )}
                {registry.lengthMeters && (
                  <div>
                    <div className="text-muted-foreground">Length</div>
                    <div className="font-medium">{registry.lengthMeters.toFixed(1)} m</div>
                  </div>
                )}
              </div>

              {/* Owner/Operator */}
              {(registry.registeredOwner || registry.operatorName) && (
                <div className="border-t pt-4 space-y-2">
                  {registry.registeredOwner && (
                    <div>
                      <div className="text-sm text-muted-foreground">Registered Owner</div>
                      <div className="font-medium">{registry.registeredOwner}</div>
                    </div>
                  )}
                  {registry.operatorName && (
                    <div>
                      <div className="text-sm text-muted-foreground">Operator</div>
                      <div className="font-medium">{registry.operatorName}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              {(registry.companyEmail || registry.companyPhone || registry.companyWebsite) && (
                <div className="border-t pt-4">
                  <div className="text-sm font-semibold mb-3">Contact Information</div>
                  <div className="space-y-2">
                    {registry.companyEmail && (
                      <a 
                        href={`mailto:${registry.companyEmail}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Mail className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">Email</div>
                          <div className="font-medium truncate">{registry.companyEmail}</div>
                        </div>
                      </a>
                    )}
                    {registry.companyPhone && (
                      <a 
                        href={`tel:${registry.companyPhone}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Phone className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">Phone</div>
                          <div className="font-medium">{registry.companyPhone}</div>
                        </div>
                      </a>
                    )}
                    {registry.companyWebsite && (
                      <a 
                        href={registry.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Globe className="h-4 w-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">Website</div>
                          <div className="font-medium truncate">{registry.companyWebsite}</div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {registry === null ? 'Loading vessel registry data...' : 'No public registry data available'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Chat with Crew */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Crew
            </CardTitle>
            <CardDescription>
              Messages are logged for manual delivery (GDPR compliant)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="mb-4 space-y-3 max-h-[400px] overflow-y-auto">
              {(!chatData || chatData.messages.length === 0) && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {chatData ? 'No messages yet. Start a conversation!' : 'Loading chat...'}
                </div>
              )}
              {chatData?.messages && chatData.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm">{msg.message_text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={sendingMessage || !newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


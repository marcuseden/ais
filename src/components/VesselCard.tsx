"use client"

import { useState, useEffect } from 'react';
import { VesselPosition } from '@/lib/ais';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Ship, Navigation, Gauge, MessageCircle, Phone, Mail, Building, Globe, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface VesselCardProps {
  vessel: VesselPosition;
  onClick?: () => void;
  isSelected?: boolean;
}

interface VesselRegistry {
  found: boolean;
  imoNumber?: number;
  registeredOwner?: string;
  operatorName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  flagCountry?: string;
  dataQualityScore?: number;
  dataSources?: string[];
}

interface ChatData {
  chat: any;
  messages: any[];
}

export function VesselCard({ vessel, onClick, isSelected }: VesselCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [registryData, setRegistryData] = useState<VesselRegistry | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRegistryData = async () => {
    try {
      const response = await fetch(`/api/vessel-lookup/${vessel.mmsi}`);
      const data = await response.json();
      setRegistryData(data);
    } catch (error) {
      console.error('Failed to load registry data:', error);
    }
  };

  const loadChat = async () => {
    try {
      const response = await fetch(`/api/vessel-chat/${vessel.mmsi}`);
      const data = await response.json();
      setChatData(data);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatData?.chat) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/vessel-chat/${vessel.mmsi}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatData.chat.id,
          message: newMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      await loadChat(); // Reload messages

      toast({
        title: 'Message sent',
        description: 'Your message has been logged for manual delivery.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        className={`cursor-pointer transition-colors hover:bg-accent ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={onClick}
      >
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {vessel.name || `MMSI: ${vessel.mmsi}`}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {vessel.ship_type && <span>{vessel.ship_type}</span>}
                {vessel.sog !== undefined && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Gauge className="h-2.5 w-2.5" />
                      {vessel.sog.toFixed(1)}kn
                    </span>
                  </>
                )}
                {vessel.cog !== undefined && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Navigation className="h-2.5 w-2.5" />
                      {vessel.cog.toFixed(0)}°
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-7 text-xs"
                  onClick={loadRegistryData}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Info
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{vessel.name || `Vessel ${vessel.mmsi}`}</DialogTitle>
                  <DialogDescription>
                    Complete vessel and owner information
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Vessel Info */}
                  <div>
                    <h3 className="font-semibold mb-2">Vessel Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">MMSI:</span> {vessel.mmsi}
                      </div>
                      {registryData?.imoNumber && (
                        <div>
                          <span className="text-muted-foreground">IMO:</span> {registryData.imoNumber}
                        </div>
                      )}
                      {registryData?.flagCountry && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Flag:</span> {registryData.flagCountry}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner/Operator Info */}
                  {registryData?.found && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Owner & Operator
                      </h3>
                      <div className="space-y-2 text-sm">
                        {registryData.registeredOwner && (
                          <div>
                            <span className="text-muted-foreground">Registered Owner:</span>
                            <div className="font-medium">{registryData.registeredOwner}</div>
                          </div>
                        )}
                        {registryData.operatorName && (
                          <div>
                            <span className="text-muted-foreground">Operator:</span>
                            <div className="font-medium">{registryData.operatorName}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {registryData?.found && (registryData.companyEmail || registryData.companyPhone || registryData.companyWebsite) && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        {registryData.companyEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${registryData.companyEmail}`} className="text-primary hover:underline">
                              {registryData.companyEmail}
                            </a>
                          </div>
                        )}
                        {registryData.companyPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${registryData.companyPhone}`} className="text-primary hover:underline">
                              {registryData.companyPhone}
                            </a>
                          </div>
                        )}
                        {registryData.companyWebsite && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={registryData.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {registryData.companyWebsite}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                        <strong>Data Source:</strong> {registryData.dataSources?.join(', ') || 'Public Registries'}
                        {registryData.dataQualityScore && (
                          <> • Quality: {registryData.dataQualityScore}%</>
                        )}
                      </div>
                    </div>
                  )}

                  {!registryData?.found && (
                    <div className="border-t pt-4">
                      <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                        No public registry data available. Contact information may be added via opt-in verification.
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showChat} onOpenChange={setShowChat}>
              <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-7 text-xs"
                  onClick={loadChat}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Chat with {vessel.name || `Vessel ${vessel.mmsi}`}</DialogTitle>
                  <DialogDescription>
                    Messages are logged for manual delivery (GDPR compliant)
                  </DialogDescription>
                </DialogHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 py-4">
                  {chatData?.messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Start a conversation!
                    </div>
                  )}
                  {chatData?.messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
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
                <div className="flex gap-2 pt-4 border-t">
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
                  />
                  <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
                    Send
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    </>
  );
}


import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Globe, Check, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NumberPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (number: string) => void;
}

export function NumberPurchaseModal({ isOpen, onClose, onSuccess }: NumberPurchaseModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [countryCode, setCountryCode] = useState("US");
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const fetchNumbers = async () => {
    if (!user) return;
    setSearching(true);
    try {
      // Points to our Express proxy server
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/voice/available-numbers?country=${countryCode}&userId=${user.id}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      const numbers = data.numbers || [];
      setAvailableNumbers(numbers);
      if (numbers.length === 0) {
        toast.info("No numbers found. Please ensure your Vobiz account has available inventory or check your settings.");
      }
    } catch (error: any) {
      console.error("Error fetching numbers:", error);
      toast.error(error.message || "Failed to fetch available numbers");
    } finally {
      setSearching(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedNumber || !user) return;
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/voice/purchase-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: selectedNumber, userId: user.id }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      toast.success(`Successfully purchased ${selectedNumber}`);
      onSuccess(selectedNumber);
      onClose();
    } catch (error: any) {
      console.error("Error purchasing number:", error);
      toast.error(error.message || "Failed to purchase number. Please check your Vobiz settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-border/40 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Buy a Voice AI Number
          </DialogTitle>
          <DialogDescription>
            Choose a professional number for your AI agents to use for calling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Country Code (e.g. US, GB)"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="pl-10 h-11"
              />
            </div>
            <Button onClick={fetchNumbers} disabled={searching} className="h-11 px-6">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {availableNumbers.length > 0 ? (
              availableNumbers.map((item) => (
                <div
                  key={item.number}
                  onClick={() => setSelectedNumber(item.number)}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer
                    ${selectedNumber === item.number 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border/40 hover:border-border hover:bg-muted/50"}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{item.number}</span>
                    <span className="text-xs text-muted-foreground">{item.region}</span>
                  </div>
                  {selectedNumber === item.number && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              !searching && (
                <div className="text-center py-8 text-muted-foreground italic">
                  Search for available numbers above
                </div>
              )
            )}
          </div>

          <Button
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
            disabled={!selectedNumber || loading}
            onClick={handlePurchase}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Purchase ${selectedNumber || "Number"}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

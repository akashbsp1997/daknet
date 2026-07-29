import React, { useState, useRef } from "react";
import { useGetOperatorDashboard, createArticle, uploadArticlePhoto, MailType, type CreateArticleRequest, getGetOperatorDashboardQueryKey } from "@workspace/api-client-react";
import { Package, ScanLine, Loader2, CheckCircle2, XCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { getUser } from '@/lib/auth';
import { useToast } from "@/hooks/use-toast";
import { enqueueArticleUpdate } from "@/lib/offline-queue";

const MAIL_TYPE_LABELS: Record<string, string> = {
  speed_post: "Speed Post",
  registered_post: "Registered Post",
  parcel: "Parcel",
  gyan_post: "Gyan Post",
  magazine_post: "Magazine Post",
  blind_mail: "Blind Mail",
  regd_newspaper: "Regd. Newspaper",
  ordinary_mail: "Ordinary Mail",
  emo: "EMO",
  epost: "ePost",
  intimation: "Intimation",
  other: "Other",
};

const emptyCapture = {
  articleNumber: "", mailType: "" as string, addressee: "", deliveryAddress: "",
  careOf: "", houseNumber: "", subarea: "", area: "", postOffice: "", pincode: "",
  landmark: "", digipin: "", uidaiNumber: "",
};

export default function FieldArticles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const operatorId = getUser()?.id || "";
  const officeId = getUser()?.officeIds?.[0] || "";

  const { data: dashboard, isLoading } = useGetOperatorDashboard({
    query: { queryKey: getGetOperatorDashboardQueryKey(), enabled: !!operatorId }
  });

  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string>("delivered");
  const [deliveryReason, setDeliveryReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Photo-scan capture: a photo is kept as delivery proof, and the
  // fields below are prompts the operator fills in by hand — there's no
  // OCR/auto-extraction here, the photo is evidence, not a data source.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [captureForm, setCaptureForm] = useState(emptyCapture);
  const [isSavingCapture, setIsSavingCapture] = useState(false);

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCapturedPhoto(file);
    setCapturedPhotoUrl(URL.createObjectURL(file));
    setCaptureForm(emptyCapture);
  };

  const closeCapture = () => {
    setCapturedPhoto(null);
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
    setCapturedPhotoUrl(null);
  };

  const saveCapture = async () => {
    if (!capturedPhoto) return;
    if (!captureForm.articleNumber.trim() || !captureForm.addressee.trim() || !captureForm.deliveryAddress.trim()) {
      toast({ title: "Missing details", description: "Article number, addressee and address are required.", variant: "destructive" });
      return;
    }
    if (!navigator.onLine) {
      toast({ title: "No connection", description: "Photo scan needs connectivity — try again once you're back online.", variant: "destructive" });
      return;
    }
    if (!officeId) {
      toast({ title: "No assigned office", description: "Your account has no office assigned.", variant: "destructive" });
      return;
    }
    setIsSavingCapture(true);
    try {
      const payload: CreateArticleRequest = {
        barcode: captureForm.articleNumber.trim(),
        articleNumber: captureForm.articleNumber.trim(),
        addressee: captureForm.addressee.trim(),
        deliveryAddress: captureForm.deliveryAddress.trim(),
        operatorId, officeId,
        mailType: (captureForm.mailType || undefined) as MailType | undefined,
        careOf: captureForm.careOf.trim() || undefined,
        houseNumber: captureForm.houseNumber.trim() || undefined,
        subarea: captureForm.subarea.trim() || undefined,
        area: captureForm.area.trim() || undefined,
        postOffice: captureForm.postOffice.trim() || undefined,
        pincode: captureForm.pincode.trim() || undefined,
        landmark: captureForm.landmark.trim() || undefined,
        digipin: captureForm.digipin.trim() || undefined,
        uidaiNumber: captureForm.uidaiNumber.trim() || undefined,
      };
      const article = await createArticle(payload);
      const withPhoto = await uploadArticlePhoto(article.id, { photo: capturedPhoto });
      closeCapture();
      setSelectedArticle(withPhoto);
      setDeliveryStatus("delivered");
      setDeliveryReason("");
      queryClient.invalidateQueries({ queryKey: getGetOperatorDashboardQueryKey() });
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err?.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsSavingCapture(false);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

  const submitStatus = async () => {
    if (!selectedArticle) return;
    setIsProcessing(true);

    const position = await getCurrentPosition();

    // Written to the on-device queue first, regardless of connectivity —
    // it flushes to the server automatically once online, so a delivery
    // confirmation can never be silently lost to a bad signal.
    await enqueueArticleUpdate(selectedArticle.id, {
      status: deliveryStatus as any,
      deliveryReason: deliveryStatus !== 'delivered' ? deliveryReason : undefined,
      gpsLat: position?.coords.latitude,
      gpsLng: position?.coords.longitude,
    });

    setIsProcessing(false);
    setSelectedArticle(null);
    toast({
      title: "Status updated",
      description: navigator.onLine ? undefined : "No connection — will sync automatically once you're back online.",
    });
    queryClient.invalidateQueries({ queryKey: getGetOperatorDashboardQueryKey() });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'attempted' || status === 'returned') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Package className="w-4 h-4 text-amber-500" />;
  };

  if (isLoading || !dashboard) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Articles</h2>
        <Button onClick={() => fileInputRef.current?.click()} size="sm">
          <Camera className="w-4 h-4 mr-2" />
          Scan
        </Button>
      </div>

      <div className="space-y-3">
        {dashboard.articles.map(article => (
          <Card key={article.id} className="active-elevate" onClick={() => setSelectedArticle(article)}>
            <CardContent className="p-4 flex gap-3 cursor-pointer">
              <div className="mt-1">{getStatusIcon(article.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold truncate text-sm">{article.addressee}</h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">{article.deliveryAddress}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{article.articleNumber}</span>
                  {article.isCod && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">COD: ₹{article.codAmount}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {dashboard.articles.length === 0 && (
          <div className="p-8 text-center bg-muted/50 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">No articles assigned today.</p>
          </div>
        )}
      </div>

      {/* Photo-scan capture: photo kept as proof, fields below are manual entry prompts */}
      <Sheet open={!!capturedPhoto} onOpenChange={(open) => !open && closeCapture()}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b text-left shrink-0">
            <SheetTitle className="text-lg flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Log Scanned Article
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {capturedPhotoUrl && (
              <img src={capturedPhotoUrl} alt="Captured label" className="w-full max-h-48 object-contain rounded-lg border bg-muted" />
            )}

            <div className="space-y-1.5">
              <Label>Article Number *</Label>
              <Input value={captureForm.articleNumber} onChange={e => setCaptureForm({ ...captureForm, articleNumber: e.target.value })} className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label>Mail Type</Label>
              <Select value={captureForm.mailType} onValueChange={v => setCaptureForm({ ...captureForm, mailType: v })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select mail type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MAIL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Name of Addressee *</Label>
              <Input value={captureForm.addressee} onChange={e => setCaptureForm({ ...captureForm, addressee: e.target.value })} className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label>Address of Addressee *</Label>
              <Textarea value={captureForm.deliveryAddress} onChange={e => setCaptureForm({ ...captureForm, deliveryAddress: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Care Of</Label>
                <Input value={captureForm.careOf} onChange={e => setCaptureForm({ ...captureForm, careOf: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>House Number</Label>
                <Input value={captureForm.houseNumber} onChange={e => setCaptureForm({ ...captureForm, houseNumber: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Subarea</Label>
                <Input value={captureForm.subarea} onChange={e => setCaptureForm({ ...captureForm, subarea: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Area</Label>
                <Input value={captureForm.area} onChange={e => setCaptureForm({ ...captureForm, area: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Post Office</Label>
                <Input value={captureForm.postOffice} onChange={e => setCaptureForm({ ...captureForm, postOffice: e.target.value })} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input value={captureForm.pincode} onChange={e => setCaptureForm({ ...captureForm, pincode: e.target.value })} className="h-11" inputMode="numeric" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Landmark</Label>
              <Input value={captureForm.landmark} onChange={e => setCaptureForm({ ...captureForm, landmark: e.target.value })} className="h-11" />
            </div>

            {captureForm.mailType === MailType.speed_post && (
              <div className="space-y-1.5">
                <Label>DigiPIN (if available)</Label>
                <Input value={captureForm.digipin} onChange={e => setCaptureForm({ ...captureForm, digipin: e.target.value })} className="h-11 font-mono" />
              </div>
            )}

            {captureForm.mailType === MailType.registered_post && (
              <div className="space-y-1.5">
                <Label>UIDAI / Aadhaar Number</Label>
                <Input value={captureForm.uidaiNumber} onChange={e => setCaptureForm({ ...captureForm, uidaiNumber: e.target.value })} className="h-11 font-mono" inputMode="numeric" />
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-card shrink-0 pb-safe">
            <Button size="lg" className="w-full h-14 font-bold text-base" onClick={saveCapture} disabled={isSavingCapture}>
              {isSavingCapture ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
              Save & Continue
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 flex flex-col">
          {selectedArticle && (
            <>
              <SheetHeader className="p-4 border-b text-left shrink-0">
                <SheetTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Update Status
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="bg-muted p-4 rounded-xl space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Addressee</p>
                    <p className="font-bold">{selectedArticle.addressee}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm leading-snug">{selectedArticle.deliveryAddress}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <p className="font-mono text-sm">{selectedArticle.articleNumber}</p>
                    {selectedArticle.isCod && <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Collect: ₹{selectedArticle.codAmount}</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Update Status</Label>
                  <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivered">Delivered Successfully</SelectItem>
                      <SelectItem value="attempted">Attempted (Not available)</SelectItem>
                      <SelectItem value="returned">Return to Sender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {deliveryStatus !== 'delivered' && (
                  <div className="space-y-3">
                    <Label>Reason</Label>
                    <Input
                      placeholder="e.g. Door locked, wrong address"
                      value={deliveryReason}
                      onChange={(e) => setDeliveryReason(e.target.value)}
                      className="h-12"
                    />
                  </div>
                )}
              </div>
              <div className="p-4 border-t bg-card shrink-0 pb-safe">
                <Button
                  size="lg"
                  className="w-full h-14 font-bold text-base"
                  onClick={submitStatus}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Confirm Update
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

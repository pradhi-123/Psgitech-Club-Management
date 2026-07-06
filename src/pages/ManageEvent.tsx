import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/apiClient";
import { ArrowLeft, Calendar, QrCode, FileText, CheckCircle, User, Phone, Mail, Award, Clock, Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QRScanner } from "@/components/QRScanner";
import jsPDF from "jspdf";
import collegeLogo from "@/assets/college-logo.png";
import PullToRefresh from "react-simple-pull-to-refresh";

const ManageEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scanType, setScanType] = useState<'entry' | 'exit'>('entry');
  const [dataLoading, setDataLoading] = useState(true);
  const [volunteerRolls, setVolunteerRolls] = useState<string[]>([]);
  const [volunteerNames, setVolunteerNames] = useState<Record<string, string>>({});

  // Edit Event Form State
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "Cultural",
    event_date: "",
    duration: 60,
    max_participants: "",
    credit_points: 2,
    bonus_points: 0,
    volunteer_points: 3,
    volunteers: "",
  });

  useEffect(() => {
    if (!loading && (!profile || (profile.role !== "coordinator" && profile.role !== "admin"))) {
      navigate("/login");
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setDataLoading(true);
      const [eventsList, regsList] = await Promise.all([
        api.get("/api/events"),
        api.get(`/api/events/registrations/${eventId}`)
      ]);

      const foundEvent = eventsList.find((e: any) => e.id === eventId);
      if (!foundEvent) {
        toast.error("Event not found");
        navigate("/coordinator");
        return;
      }

      setEvent(foundEvent);
      setRegistrations(regsList || []);

      if (foundEvent.volunteers) {
        const rolls = foundEvent.volunteers.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0);
        setVolunteerRolls(rolls);
        
        try {
          const nameData = await api.post("/api/events/volunteers/names", { rollNumbers: rolls });
          setVolunteerNames(nameData.nameMap || {});
        } catch (nameErr) {
          console.error("Failed to load volunteer names", nameErr);
        }
      } else {
        setVolunteerRolls([]);
        setVolunteerNames({});
      }

      // Pre-fill edit form
      // Convert ISO date back to local datetime-local input format
      const localDate = foundEvent.event_date ? foundEvent.event_date.substring(0, 16) : "";
      setEditForm({
        name: foundEvent.name || "",
        description: foundEvent.description || "",
        category: foundEvent.category || "Cultural",
        event_date: localDate,
        duration: foundEvent.duration || 60,
        max_participants: foundEvent.max_participants ? foundEvent.max_participants.toString() : "",
        credit_points: foundEvent.credit_points || 2,
        bonus_points: foundEvent.bonus_points || 0,
        volunteer_points: foundEvent.volunteer_points || 3,
        volunteers: foundEvent.volunteers || "",
      });

      setDataLoading(false);
    } catch (error: any) {
      toast.error("Failed to load event details: " + error.message);
      setDataLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editForm.name || !editForm.event_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.put(`/api/events/edit/${eventId}`, {
        ...editForm,
        max_participants: editForm.max_participants ? parseInt(editForm.max_participants) : null
      });

      toast.success("Event details updated successfully!");
      fetchEventData();
    } catch (error: any) {
      toast.error("Failed to update event: " + error.message);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    try {
      const res = await api.post("/api/events/scan", {
        eventId,
        qrCode,
        scanType
      });

      toast.success(res.message);
      setShowScanner(false);
      fetchEventData(); // Refresh details
    } catch (error: any) {
      toast.error('Scan failed: ' + error.message);
    }
  };

  const handleConfirmVolunteer = async (rollNumber: string) => {
    try {
      const res = await api.post("/api/events/volunteers/confirm", {
        eventId,
        rollNumber: rollNumber.trim()
      });

      toast.success(res.message);
      fetchEventData();
    } catch (error: any) {
      toast.error("Failed to confirm volunteer: " + error.message);
    }
  };

  const handleGenerateCertificate = async (registrationId: string) => {
    try {
      const data = await api.post('/api/events/certificates/generate', { registrationId });
      if (data?.certificate) {
        const cert = data.certificate;
        
        // Create PDF using jsPDF
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // 1. Background fill (soft off-white cream)
        pdf.setFillColor(252, 251, 249);
        pdf.rect(0, 0, 297, 210, 'F');

        // 2. Thick Navy Blue outer frame
        pdf.setDrawColor(15, 30, 54);
        pdf.setLineWidth(1.5);
        pdf.rect(10, 10, 277, 180, 'S');

        // 3. Thin Amber Gold inner frame
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.6);
        pdf.rect(13, 13, 271, 174, 'S');

        // 4. Corner Ornaments
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.8);
        pdf.line(16, 16, 26, 16); pdf.line(16, 16, 16, 26); // Top-Left
        pdf.line(281, 16, 271, 16); pdf.line(281, 16, 281, 26); // Top-Right
        pdf.line(16, 184, 26, 184); pdf.line(16, 184, 16, 174); // Bottom-Left
        pdf.line(281, 184, 271, 184); pdf.line(281, 184, 281, 174); // Bottom-Right

        // 5. Add Logo (Centered)
        const logoWidth = 80;
        const logoHeight = 12;
        const logoX = 148.5 - (logoWidth / 2);
        const logoY = 18;
        pdf.addImage(collegeLogo, 'PNG', logoX, logoY, logoWidth, logoHeight);

        // 6. College Header
        pdf.setFont('times', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(15, 30, 54);
        pdf.text('PSG Institute of Technology and Applied Research', 148.5, 40, { align: 'center' });
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 110, 120);
        pdf.text('COIMBATORE - 641 062 | TAMIL NADU, INDIA', 148.5, 46, { align: 'center' });

        // 7. Decorative line
        pdf.setDrawColor(212, 175, 55);
        pdf.setLineWidth(0.4);
        pdf.line(100, 50, 197, 50);

        // 8. Certificate Title & Type mapping
        const isVolCert = cert.certificateType === 'volunteer';
        pdf.setFont('times', 'bolditalic');
        pdf.setFontSize(isVolCert ? 22 : 24);
        pdf.setTextColor(180, 140, 60);
        pdf.text(isVolCert ? 'Certificate of Volunteer Service' : 'Certificate of Participation', 148.5, 68, { align: 'center' });

        // 9. Presentation phrase
        pdf.setFont('helvetica', 'oblique');
        pdf.setFontSize(11);
        pdf.setTextColor(80, 85, 90);
        pdf.text('This is to certify that', 148.5, 78, { align: 'center' });

        // 10. Student Name
        pdf.setFont('times', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(15, 30, 54);
        pdf.text(cert.studentName.toUpperCase(), 148.5, 89, { align: 'center' });

        // 11. Student details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(60, 65, 70);
        pdf.text(
          `Roll No: ${cert.rollNumber}  |  Dept: ${cert.department}  |  Year: ${cert.year}  |  Section: ${cert.section}`,
          148.5,
          97,
          { align: 'center' }
        );

        // 12. Achievement Text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(80, 85, 90);
        pdf.text(isVolCert ? 'has successfully served as a Student Volunteer for' : 'has active participation in the event', 148.5, 107, { align: 'center' });

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(15);
        pdf.setTextColor(15, 30, 54);
        pdf.text(`"${cert.eventName}"`, 148.5, 116, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(60, 65, 70);
        pdf.text(
          `Organized by the ${cert.clubName} at PSG iTech on ${cert.issuedDate}.`,
          148.5,
          124,
          { align: 'center' }
        );

        // 13. Credit Points Frame
        pdf.setDrawColor(212, 175, 55);
        pdf.setFillColor(255, 252, 240);
        pdf.setLineWidth(0.3);
        pdf.rect(103, 130, 91, 8, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(180, 140, 60);
        pdf.text(`${isVolCert ? 'VOLUNTEER' : 'CREDIT'} POINTS EARNED: ${cert.creditPoints}`, 148.5, 135.5, { align: 'center' });

        // 14. Signatures
        pdf.setDrawColor(180, 185, 190);
        pdf.setLineWidth(0.4);
        pdf.line(40, 158, 90, 158);
        
        pdf.setFont('times', 'italic');
        pdf.setFontSize(13);
        pdf.setTextColor(15, 30, 54);
        const coordNames = event?.clubs?.coordinators?.map((c: any) => c.name).join(', ') || profile?.full_name || 'Club Coordinator';
        pdf.text(coordNames, 65, 154, { align: 'center' });
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 110, 120);
        pdf.text('Club Coordinator(s)', 65, 163, { align: 'center' });

        // Right side: Principal
        pdf.line(207, 158, 257, 158);
        pdf.text('Dr. Saravanakumar', 232, 154, { align: 'center' });
        pdf.text('Principal, PSG iTech', 232, 163, { align: 'center' });

        // 15. Certificate Metadata
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 145, 150);
        pdf.text(`Certificate ID: ${cert.certificateId}  |  Issued: ${cert.issuedDate}`, 148.5, 174, { align: 'center' });
        
        // Open PDF in a new tab instead of download
        const blobUrl = pdf.output('bloburl');
        window.open(blobUrl, '_blank');
        toast.success('Certificate generated successfully!');
      }
    } catch (error: any) {
      toast.error('Failed to generate certificate: ' + error.message);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-medium">Loading event management portal...</p>
        </div>
      </div>
    );
  }



  return (
    <>
      <PullToRefresh onRefresh={fetchEventData} pullingContent="">
        <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100 pb-12">
          {/* Header */}
          <header className="bg-gradient-primary text-white shadow-lg">
            <div className="container mx-auto px-4 py-4 sm:py-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={() => navigate("/coordinator")} 
                  className="rounded-full h-9 w-9 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-primary" />
                </Button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">Manage: {event?.name}</h1>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                    {event?.clubs?.name} • Scheduled on {event?.event_date ? new Date(event.event_date).toLocaleDateString() : ""}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 mt-6">
            <Tabs defaultValue="participants" className="space-y-6">
              <TabsList className="grid grid-cols-3 max-w-md w-full">
                <TabsTrigger value="participants">Attendees</TabsTrigger>
                <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
                <TabsTrigger value="edit">Edit Event</TabsTrigger>
              </TabsList>

              {/* Tab 1: Attendees List & Scan */}
              <TabsContent value="participants" className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                  <div>
                    <h3 className="font-semibold text-lg">Scanned Attendees</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Use the scanner to confirm entries and exits for credit points.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={scanType} onValueChange={(value: any) => setScanType(value)}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Scan</SelectItem>
                        <SelectItem value="exit">Exit Scan</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button onClick={() => setShowScanner(true)} className="gap-1.5 h-9 shrink-0 flex-1 sm:flex-initial">
                      <QrCode className="w-4 h-4" /> Start Scan
                    </Button>
                  </div>
                </div>

                <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base sm:text-lg">Student Attendance Logs ({registrations.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    {registrations.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                        No registrations or scans logged for this event.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                            <th className="p-4">Student</th>
                            <th className="p-4">Roll Number</th>
                            <th className="p-4">Entry Scan</th>
                            <th className="p-4">Exit Scan</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrations.map((reg) => (
                            <tr key={reg.id} className="border-b hover:bg-muted/10 transition-colors">
                              <td className="p-4 font-medium text-foreground">
                                {reg.profiles?.full_name}
                                {reg.is_volunteer && <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 text-[10px]">Volunteer</Badge>}
                              </td>
                              <td className="p-4">{reg.profiles?.roll_number}</td>
                              <td className="p-4 text-muted-foreground">
                                {reg.entry_scanned_at ? new Date(reg.entry_scanned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {reg.exit_scanned_at ? new Date(reg.exit_scanned_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                              <td className="p-4">
                                <Badge variant={reg.attendance_confirmed ? "default" : "secondary"}>
                                  {reg.attendance_confirmed ? "Confirmed" : "Pending"}
                                </Badge>
                              </td>
                              <td className="p-4 text-right">
                                {reg.attendance_confirmed && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleGenerateCertificate(reg.id)}
                                    className="h-8 gap-1 text-xs"
                                  >
                                    <Award className="w-3.5 h-3.5" /> View Certificate
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Volunteers Confirmation */}
              <TabsContent value="volunteers" className="space-y-4">
                <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base sm:text-lg">Event Volunteers ({volunteerRolls.length})</CardTitle>
                    <CardDescription>Verify and confirm attendance for volunteers to award volunteer credits.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    {volunteerRolls.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                        No volunteers assigned to this event.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                            <th className="p-4">Roll Number</th>
                            <th className="p-4">Linked Student Name</th>
                            <th className="p-4">Volunteer Credits</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {volunteerRolls.map((roll, idx) => {
                            // Find matching registration details
                            const reg = registrations.find(r => r.profiles?.roll_number?.trim().toLowerCase() === roll.toLowerCase() && r.is_volunteer);
                            const isConfirmed = reg?.attendance_confirmed;

                            return (
                              <tr key={idx} className="border-b hover:bg-muted/10 transition-colors">
                                <td className="p-4 font-mono font-semibold">{roll}</td>
                                <td className="p-4 text-foreground">
                                  {volunteerNames[roll] || reg?.profiles?.full_name || "Account not created yet"}
                                </td>
                                <td className="p-4 font-medium text-amber-600">{event?.volunteer_points || 3} pts</td>
                                <td className="p-4">
                                  <Badge variant={isConfirmed ? "default" : "secondary"} className={isConfirmed ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}>
                                    {isConfirmed ? "Volunteer Confirmed" : "Pending Confirmation"}
                                  </Badge>
                                </td>
                                <td className="p-4 text-right">
                                  {isConfirmed ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleGenerateCertificate(reg.id)}
                                      className="h-8 gap-1 text-xs"
                                    >
                                      <Award className="w-3.5 h-3.5 text-amber-500" /> View Certificate
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleConfirmVolunteer(roll)}
                                      className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                    >
                                      Confirm Attendance
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Edit Event Form */}
              <TabsContent value="edit" className="space-y-4">
                <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Edit Event Details</CardTitle>
                    <CardDescription>Modify description, credit points, categories, schedule, and volunteer rosters.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Event Name *</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter event name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Enter event description"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-category">Category</Label>
                        <Select value={editForm.category} onValueChange={(value: any) => setEditForm({ ...editForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cultural">Cultural</SelectItem>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Competition">Competition</SelectItem>
                            <SelectItem value="Workshop">Workshop</SelectItem>
                            <SelectItem value="Quiz">Quiz</SelectItem>
                            <SelectItem value="Guest Lecture">Guest Lecture</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-date">Event Date & Time *</Label>
                        <Input
                          id="edit-date"
                          type="datetime-local"
                          value={editForm.event_date}
                          onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-duration">Duration (minutes)</Label>
                        <Input
                          id="edit-duration"
                          type="number"
                          value={editForm.duration}
                          onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-max-participants">Max Participants</Label>
                        <Input
                          id="edit-max-participants"
                          type="number"
                          value={editForm.max_participants}
                          onChange={(e) => setEditForm({ ...editForm, max_participants: e.target.value })}
                          placeholder="Unlimited"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-credit-points">Credit Points</Label>
                        <Input
                          id="edit-credit-points"
                          type="number"
                          value={editForm.credit_points}
                          onChange={(e) => setEditForm({ ...editForm, credit_points: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-volunteer-points">Volunteer Credits</Label>
                        <Input
                          id="edit-volunteer-points"
                          type="number"
                          value={editForm.volunteer_points}
                          onChange={(e) => setEditForm({ ...editForm, volunteer_points: parseInt(e.target.value) || 3 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-volunteers">Volunteers (Roll Numbers)</Label>
                        <Input
                          id="edit-volunteers"
                          value={editForm.volunteers}
                          onChange={(e) => setEditForm({ ...editForm, volunteers: e.target.value })}
                          placeholder="e.g. 22AD001, 22AD002"
                        />
                      </div>
                    </div>

                    <Button onClick={handleUpdateEvent} className="w-full mt-2">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefresh>

      {/* QR Scanner Overlays */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white py-2">
            <h2 className="text-lg font-semibold capitalize">{scanType} Scanner</h2>
            <Button variant="ghost" onClick={() => setShowScanner(false)} className="text-white hover:bg-white/10">Close</Button>
          </div>
          <div className="flex-1 flex items-center justify-center max-h-[70vh]">
            <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
          </div>
          <div className="text-center text-white py-4 text-sm bg-black/50 rounded-lg">
            Position the student's entry or exit QR code within the frame to scan.
          </div>
        </div>
      )}
    </>
  );
};

export default ManageEvent;

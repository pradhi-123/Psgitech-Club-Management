import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/apiClient";
import { LogOut, Plus, Calendar, QrCode, FileText, CheckCircle, User, Phone, Bell, BellOff, Trash2, Mail, Trophy, Award, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import collegeLogo from "@/assets/college-logo.png";
import PullToRefresh from "react-simple-pull-to-refresh";

const clubGradients = [
  "from-blue-500/10 to-cyan-500/10 border-cyan-500/30 text-cyan-950",
  "from-purple-500/10 to-pink-500/10 border-pink-500/30 text-pink-950",
  "from-amber-500/10 to-orange-500/10 border-orange-500/30 text-amber-950",
  "from-emerald-500/10 to-teal-500/10 border-teal-500/30 text-emerald-950",
  "from-rose-500/10 to-red-500/10 border-red-500/20 text-rose-950",
];

const CoordinatorDashboard = () => {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    club_id: "",
    category: "Cultural" as const,
    event_date: "",
    duration: 60,
    max_participants: "",
    credit_points: 2,
    bonus_points: 0,
    volunteer_points: 3,
    volunteers: "",
  });

  // Coordinator Participate View States
  const [credits, setCredits] = useState({ total_points: 0, events_attended: 0, badges_earned: 0 });
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [participateEvents, setParticipateEvents] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState<string>("");

  // Search/Filter states
  const [myEventsSearch, setMyEventsSearch] = useState("");
  const [myEventsCategoryFilter, setMyEventsCategoryFilter] = useState("all");
  const [participateSearch, setParticipateSearch] = useState("");
  const [participateClubFilter, setParticipateClubFilter] = useState("all");

  // Notification States
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [isUpdatePhoneOpen, setIsUpdatePhoneOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const handleUpdateProfile = async () => {
    try {
      await api.put("/api/auth/users/profile", { phone: newPhoneNumber, email: newEmail });
      toast.success("Profile details updated successfully!");
      setIsUpdatePhoneOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    }
  };
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("dismissed_notifications_coord") || "[]");
  });

  useEffect(() => {
    if (profile) {
      setNewPhoneNumber(profile.phone && profile.phone !== "Unavailable" ? profile.phone : "");
      setNewEmail(profile.email && !profile.email.endsWith('@psgitech.ac.in') && profile.email !== "Unavailable" ? profile.email : "");
    }
  }, [profile]);

  const handleDismissNotification = (id: string) => {
    const updated = [...dismissedNotifications, id];
    setDismissedNotifications(updated);
    localStorage.setItem("dismissed_notifications_coord", JSON.stringify(updated));
  };

  const handleDismissAllNotifications = () => {
    const allIds = activeNotifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedNotifications, ...allIds]));
    setDismissedNotifications(updated);
    localStorage.setItem("dismissed_notifications_coord", JSON.stringify(updated));
  };

  // Compile recent event notifications
  const activeNotifications = (() => {
    const list: Array<{ id: string; title: string; message: string; date: string; type: 'recent' }> = [];
    if (!profile) return list;

    myEvents.forEach(event => {
      const createdAt = event.created_at ? new Date(event.created_at).getTime() : 0;
      const isRecentEvent = Date.now() - createdAt < 7 * 24 * 60 * 60 * 1000;
      if (isRecentEvent) {
        list.push({
          id: `recent-${event.id}`,
          title: "Recent Event Created 📢",
          message: `"${event.name}" was successfully added to your events calendar, scheduled for ${new Date(event.event_date).toLocaleDateString()} at ${new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          date: event.created_at || event.event_date,
          type: 'recent'
        });
      }
    });

    return list.filter(n => !dismissedNotifications.includes(n.id));
  })();

  const unreadCount = activeNotifications.length;

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "coordinator")) {
      navigate("/login");
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [clubsData, eventsData, allEventsData, myRegsData, creditsData] = await Promise.all([
        api.get("/api/clubs"),
        api.get("/api/events/coordinator"),
        api.get("/api/events"),
        api.get("/api/events/my-registrations"),
        api.get("/api/events/students/credits")
      ]);

      // Filter clubs where this coordinator's email matches one of the coordinators
      const myClubsFiltered = clubsData?.filter((club: any) => 
        club.coordinators?.some((c: any) => c.email?.toLowerCase() === profile?.email?.toLowerCase())
      ) || [];

      setMyClubs(myClubsFiltered);
      setMyEvents(eventsData || []);

      // Participate View Data
      setAllClubs(clubsData || []);
      setParticipateEvents(allEventsData || []);
      setMyRegistrations(myRegsData || []);
      if (creditsData) {
        setCredits(creditsData);
      }
    } catch (error: any) {
      toast.error("Failed to load coordinator data: " + error.message);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.club_id || !eventForm.event_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/api/events", {
        name: eventForm.name,
        description: eventForm.description,
        club_id: eventForm.club_id,
        category: eventForm.category,
        event_date: eventForm.event_date,
        duration: eventForm.duration,
        max_participants: eventForm.max_participants ? parseInt(eventForm.max_participants) : null,
        credit_points: eventForm.credit_points,
        bonus_points: eventForm.bonus_points,
        volunteer_points: eventForm.volunteer_points,
        volunteers: eventForm.volunteers,
      });

      toast.success("Event created successfully!");
      setIsCreateDialogOpen(false);
      setEventForm({
        name: "",
        description: "",
        club_id: "",
        category: "Cultural",
        event_date: "",
        duration: 60,
        max_participants: "",
        credit_points: 2,
        bonus_points: 0,
        volunteer_points: 3,
        volunteers: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to create event: " + error.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event? This will also remove all registrations for it.")) return;
    try {
      await api.delete(`/api/events/${eventId}`);
      toast.success("Event deleted successfully!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete event: " + error.message);
    }
  };

  const handleExportMyEventsCSV = () => {
    const headers = ["Event Name", "Club Name", "Category", "Date", "Duration (mins)", "Max Participants", "Registrations", "Attended"];
    const rows = myEvents.map(e => [
      `"${e.name.replace(/"/g, '""')}"`,
      `"${(e.clubs?.name || '').replace(/"/g, '""')}"`,
      `"${e.category || ''}"`,
      new Date(e.event_date).toISOString().split('T')[0],
      e.duration,
      e.max_participants || "Unlimited",
      e.registered_count || 0,
      e.attended_count || 0
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `club_events_report_${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Events report exported successfully!");
  };

  // Participate view registrations
  const showConfirmRegisterDialog = (eventId: string) => {
    const isRegistered = myRegistrations.some(reg => reg.event_id === eventId);
    if (isRegistered) {
      toast.error("You are already registered for this event!");
      return;
    }

    // Exclusion rule: Coordinators don't register as volunteers, but let's check roll numbers just in case
    const eventObj = participateEvents.find(e => e.id === eventId);
    const vols = eventObj?.volunteers ? eventObj.volunteers.split(',').map((s: string) => s.trim().toLowerCase()) : [];
    if (profile?.roll_number && vols.includes(profile.roll_number.toLowerCase())) {
      toast.error("You are listed as a volunteer for this event and cannot register as a participant.");
      return;
    }

    setSelectedEventId(eventId);
    setConfirmDialogOpen(true);
  };


  const handleRegisterEvent = async () => {
    if (!profile?.id || !selectedEventId) return;

    try {
      await api.post("/api/events/register", { eventId: selectedEventId });
      setConfirmDialogOpen(false);
      toast.success("Successfully registered for the event!");
      fetchData();
    } catch (error: any) {
      setConfirmDialogOpen(false);
      toast.error("Failed to register: " + error.message);
    }
  };

  const showQrCode = (qrCode: string) => {
    setSelectedQrCode(qrCode);
    setQrDialogOpen(true);
  };

  const handleDownloadCertificate = async (registration: any) => {
    try {
      const data = await api.post("/api/events/certificates/generate", { registrationId: registration.id });
      const cert = data.certificate;
      
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Background
      doc.setFillColor(252, 251, 249);
      doc.rect(0, 0, 297, 210, 'F');

      // Outer Frame
      doc.setDrawColor(15, 30, 54);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, 277, 180, 'S');

      // Inner Frame
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.6);
      doc.rect(13, 13, 271, 174, 'S');

      // Corners
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.line(16, 16, 26, 16); doc.line(16, 16, 16, 26);
      doc.line(281, 16, 271, 16); doc.line(281, 16, 281, 26);
      doc.line(16, 184, 26, 184); doc.line(16, 184, 16, 174);
      doc.line(281, 184, 271, 184); doc.line(281, 184, 281, 174);

      // Logo
      const logoWidth = 80;
      const logoHeight = 12;
      const logoX = 148.5 - (logoWidth / 2);
      const logoY = 18;
      doc.addImage(collegeLogo, 'PNG', logoX, logoY, logoWidth, logoHeight);

      // Header
      doc.setFont('times', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 30, 54);
      doc.text('PSG Institute of Technology and Applied Research', 148.5, 40, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 110, 120);
      doc.text('COIMBATORE - 641 062 | TAMIL NADU, INDIA', 148.5, 46, { align: 'center' });

      // Spacing Line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.4);
      doc.line(100, 50, 197, 50);

      // Title
      const isVolCert = cert.certificateType === 'volunteer';
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(isVolCert ? 22 : 24);
      doc.setTextColor(180, 140, 60);
      doc.text(isVolCert ? 'Certificate of Volunteer Service' : 'Certificate of Participation', 148.5, 68, { align: 'center' });

      // Presentation
      doc.setFont('helvetica', 'oblique');
      doc.setFontSize(11);
      doc.setTextColor(80, 85, 90);
      doc.text('This is to certify that', 148.5, 78, { align: 'center' });

      // User Name
      doc.setFont('times', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 30, 54);
      doc.text(cert.studentName.toUpperCase(), 148.5, 89, { align: 'center' });

      // User details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 65, 70);
      const subDetails = cert.rollNumber 
        ? `Roll No: ${cert.rollNumber}  |  Dept: ${cert.department}  |  Year: ${cert.year}  |  Section: ${cert.section}`
        : `Email: ${cert.email || 'N/A'}  |  Role: Coordinator`;
      doc.text(subDetails, 148.5, 97, { align: 'center' });

      // Achievement Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 85, 90);
      doc.text(isVolCert ? 'has successfully served as a Volunteer for' : 'has active participation in the event', 148.5, 107, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 30, 54);
      doc.text(`"${cert.eventName}"`, 148.5, 116, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(60, 65, 70);
      doc.text(
        `Organized by the ${cert.clubName} at PSG iTech on ${cert.issuedDate}.`,
        148.5,
        124,
        { align: 'center' }
      );

      // Points Box
      doc.setDrawColor(212, 175, 55);
      doc.setFillColor(255, 252, 240);
      doc.setLineWidth(0.3);
      doc.rect(103, 130, 91, 8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 140, 60);
      doc.text(`${isVolCert ? 'VOLUNTEER' : 'CREDIT'} POINTS EARNED: ${cert.creditPoints}`, 148.5, 135.5, { align: 'center' });

      // Signatures
      doc.setDrawColor(180, 185, 190);
      doc.setLineWidth(0.4);
      doc.line(40, 158, 90, 158);
      
      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(15, 30, 54);
      doc.text(cert.coordinators || 'Club Coordinator', 65, 154, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text('Club Coordinator(s)', 65, 163, { align: 'center' });

      // Principal
      doc.line(207, 158, 257, 158);
      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(15, 30, 54);
      doc.text('Dr. Saravanakumar', 232, 154, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text('Principal, PSG iTech', 232, 163, { align: 'center' });

      // Footer metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 145, 150);
      doc.text(`Certificate ID: ${cert.certificateId}  |  Issued: ${cert.issuedDate}`, 148.5, 174, { align: 'center' });

      doc.save(`Certificate_${cert.studentName.replace(/\s+/g, '_')}_${cert.certificateId}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (error: any) {
      toast.error("Failed to generate certificate: " + error.message);
    }
  };

  // Filter computations
  const filteredMyEvents = myEvents.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes(myEventsSearch.toLowerCase()) || 
                          e.description?.toLowerCase().includes(myEventsSearch.toLowerCase());
    const matchesCategory = myEventsCategoryFilter === "all" || e.category === myEventsCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredParticipateEvents = participateEvents.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes(participateSearch.toLowerCase()) || 
                          e.description?.toLowerCase().includes(participateSearch.toLowerCase());
    const matchesClub = participateClubFilter === "all" || e.club_id === participateClubFilter;
    return matchesSearch && matchesClub;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PullToRefresh onRefresh={fetchData} pullingContent="">
        <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100 pb-10">
          {/* Header */}
          <header className="bg-gradient-primary text-white shadow-lg">
            <div className="container mx-auto px-4 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <img src={collegeLogo} alt="College Logo" className="h-8 sm:h-12 md:h-16 w-auto object-contain flex-shrink-0 max-w-[180px] sm:max-w-xs" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">Coordinator Dashboard</h1>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate font-medium">Welcome, {profile?.full_name}!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Button
                    onClick={() => setNotificationDialogOpen(true)}
                    variant="secondary"
                    size="sm"
                    className="relative gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 sm:w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                    <span className="hidden sm:inline">Notifications</span>
                  </Button>
                  <Dialog open={isUpdatePhoneOpen} onOpenChange={setIsUpdatePhoneOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="gap-1.5 sm:gap-2">
                        <User className="w-3.5 h-3.5 sm:w-4 h-4" />
                        <span className="hidden sm:inline">Update Profile</span>
                        <span className="sm:hidden">Profile</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Profile Details</DialogTitle>
                        <DialogDescription>Update your contact phone number and email address below.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="text-slate-700">Phone Number</Label>
                          <Input
                            type="tel"
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                            placeholder="Enter new phone number"
                            className="text-slate-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-700">Email Address</Label>
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter new email address"
                            className="text-slate-800"
                          />
                        </div>
                        <Button onClick={handleUpdateProfile} className="w-full bg-gradient-primary">
                          Save Profile Details
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button onClick={signOut} variant="secondary" size="sm" className="gap-1.5 sm:gap-2">
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" /> 
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Exit</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            <Tabs defaultValue="manage" className="space-y-6">
              {/* Outer tabs selector */}
              <TabsList className="grid w-full grid-cols-2 max-w-md bg-white/60 border border-white/50 p-1 rounded-xl shadow-sm">
                <TabsTrigger value="manage" className="font-semibold text-xs sm:text-sm">Manage Clubs & Events</TabsTrigger>
                <TabsTrigger value="participate" className="font-semibold text-xs sm:text-sm">Participate in Events</TabsTrigger>
              </TabsList>

              {/* View 1: Management Panel */}
              <TabsContent value="manage" className="space-y-6">
                {/* My Clubs */}
                <section className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">My Clubs</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myClubs.map((club, idx) => (
                      <Card key={club.id} className={`bg-gradient-to-br ${clubGradients[idx % clubGradients.length]} backdrop-blur-md border shadow-card flex flex-col justify-between hover:shadow-button hover:scale-[1.01] transition-all duration-300`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg sm:text-xl">{club.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm line-clamp-3">{club.description}</CardDescription>
                        </CardHeader>
                        {club.coordinators && club.coordinators.length > 0 && (
                          <CardContent className="pt-0 pb-5 text-sm text-muted-foreground mt-auto">
                            <div className="border-t border-slate-200/50 pt-3 space-y-3">
                              <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Club Coordinators</p>
                              <div className="space-y-2">
                                {club.coordinators.map((coord: any, index: number) => (
                                  <div key={index} className="space-y-0.5 border-l-2 border-primary/50 pl-2">
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="font-medium text-slate-900 text-xs sm:text-sm">{coord.name}</span>
                                    </div>
                                    {coord.phone && (
                                      <div className="flex items-center gap-1.5 pl-5">
                                        <Phone className="w-3 h-3 text-secondary shrink-0" />
                                        <span className="text-[11px] sm:text-xs text-slate-600">{coord.phone}</span>
                                      </div>
                                    )}
                                    {coord.email && (
                                      <div className="flex items-center gap-1.5 pl-5 min-w-0">
                                        <Mail className="w-3 h-3 text-accent shrink-0" />
                                        <span className="text-[11px] sm:text-xs text-slate-600 truncate min-w-0 flex-1">{coord.email}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </section>

                {/* My Events */}
                <section>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold">My Events</h2>
                    <div className="flex gap-2 w-full sm:w-auto animate-fadeIn">
                      <Button size="sm" variant="outline" onClick={() => handleExportMyEventsCSV()} className="gap-1.5 sm:gap-2 w-full sm:w-auto font-semibold">
                        <Download className="w-4 h-4" /> Export Excel
                      </Button>
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5 sm:gap-2 w-full sm:w-auto font-bold bg-gradient-primary">
                            <Plus className="w-4 h-4" /> Create Event
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Event</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="event-name">Event Name *</Label>
                            <Input
                              id="event-name"
                              value={eventForm.name}
                              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                              placeholder="Enter event name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="event-description">Description</Label>
                            <Textarea
                              id="event-description"
                              value={eventForm.description}
                              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                              placeholder="Enter event description"
                            />
                          </div>
                          <div>
                            <Label htmlFor="event-club">Club *</Label>
                            <Select value={eventForm.club_id} onValueChange={(value) => setEventForm({ ...eventForm, club_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a club" />
                              </SelectTrigger>
                              <SelectContent>
                                {myClubs.map((club) => (
                                  <SelectItem key={club.id} value={club.id}>
                                    {club.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="event-category">Category</Label>
                            <Select value={eventForm.category} onValueChange={(value: any) => setEventForm({ ...eventForm, category: value })}>
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="event-date">Event Date & Time *</Label>
                              <Input
                                id="event-date"
                                type="datetime-local"
                                value={eventForm.event_date}
                                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="event-duration">Duration (minutes)</Label>
                              <Input
                                id="event-duration"
                                type="number"
                                value={eventForm.duration}
                                onChange={(e) => setEventForm({ ...eventForm, duration: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="max-participants">Max Participants</Label>
                              <Input
                                id="max-participants"
                                type="number"
                                value={eventForm.max_participants}
                                onChange={(e) => setEventForm({ ...eventForm, max_participants: e.target.value })}
                                placeholder="Leave empty for unlimited"
                              />
                            </div>
                            <div>
                              <Label htmlFor="credit-points">Credit Points</Label>
                              <Input
                                id="credit-points"
                                type="number"
                                value={eventForm.credit_points}
                                onChange={(e) => setEventForm({ ...eventForm, credit_points: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="volunteer-points">Volunteer Credits</Label>
                              <Input
                                id="volunteer-points"
                                type="number"
                                value={eventForm.volunteer_points}
                                onChange={(e) => setEventForm({ ...eventForm, volunteer_points: parseInt(e.target.value) || 3 })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="event-volunteers">Volunteers</Label>
                              <Input
                                id="event-volunteers"
                                value={eventForm.volunteers}
                                onChange={(e) => setEventForm({ ...eventForm, volunteers: e.target.value })}
                                placeholder="e.g. 22AD001, 22AD002"
                              />
                            </div>
                          </div>
                          <Button onClick={handleCreateEvent} className="w-full bg-gradient-primary">
                            Create Event
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pb-3 w-full sm:max-w-2xl">
                  <Input
                    placeholder="Search my events by name or description..."
                    value={myEventsSearch}
                    onChange={(e) => setMyEventsSearch(e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border-slate-200 flex-1"
                  />
                  <Select value={myEventsCategoryFilter} onValueChange={setMyEventsCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMyEvents.length === 0 ? (
                    <Card className="col-span-full bg-white/70 border border-white/50 backdrop-blur-sm">
                      <CardContent className="py-6 sm:py-8 text-center text-sm sm:text-base text-muted-foreground">
                        No events found matching your search.
                      </CardContent>
                    </Card>
                  ) : (
                    filteredMyEvents.map((event) => (
                        <Card key={event.id} className={`bg-white/70 border border-white/50 border-l-4 ${event.category?.toLowerCase() === 'technical' ? 'border-l-blue-500' : event.category?.toLowerCase() === 'cultural' ? 'border-l-purple-500' : event.category?.toLowerCase() === 'sports' ? 'border-l-emerald-500' : 'border-l-amber-500'} backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between`}>
                          <CardHeader className="pb-3 sm:pb-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg truncate">{event.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm">
                                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">{event.clubs?.name}</span>
                                </CardDescription>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/coordinator/manage-event/${event.id}`)}
                                  className="text-xs h-8 shadow-sm border-slate-200 bg-white/80 hover:bg-white"
                                >
                                  Manage
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="h-8 w-8"
                                  title="Delete Event"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 mt-auto">
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{event.description}</p>
                            <div className="text-[11px] sm:text-xs text-slate-500 space-y-0.5 border-t border-slate-100 pt-2 flex flex-wrap gap-x-4">
                              <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
                              <p><strong>Duration:</strong> {event.duration} mins</p>
                              <p><strong>Max:</strong> {event.max_participants || "Unlimited"}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </section>
              </TabsContent>

              {/* View 2: Participation Panel */}
              <TabsContent value="participate" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                      <Trophy className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{credits.total_points}</div>
                      <p className="text-xs text-muted-foreground mt-1">Keep participating!</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
                      <Calendar className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-secondary">{credits.events_attended}</div>
                      <p className="text-xs text-muted-foreground mt-1">Great details!</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                      <Award className="h-4 w-4 text-secondary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-accent">{credits.badges_earned}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {5 - (credits.total_points % 5)} points to next badge
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Achievements Cabinet */}
                <Card className="border border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 shadow-card">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Achievements Cabinet
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Earn 5 points to unlock the next level badge! Current points: {credits.total_points}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 text-center">
                      {[
                        { level: 1, name: "Bronze Pioneer", points: 5, color: "from-amber-600 to-amber-800", icon: "🥉" },
                        { level: 2, name: "Silver Explorer", points: 10, color: "from-slate-300 to-slate-500", icon: "🥈" },
                        { level: 3, name: "Golden Achiever", points: 15, color: "from-yellow-400 to-amber-500", icon: "🥇" },
                        { level: 4, name: "Platinum Leader", points: 20, color: "from-indigo-300 to-purple-500", icon: "⚡" },
                        { level: 5, name: "Diamond Master", points: 25, color: "from-cyan-300 to-blue-500", icon: "💎" },
                        { level: 6, name: "Grand Champion", points: 30, color: "from-rose-400 to-red-600", icon: "👑" },
                      ].map((badge) => {
                        const isUnlocked = credits.total_points >= badge.points;
                        return (
                          <div 
                            key={badge.level} 
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                              isUnlocked 
                                ? "bg-card border-amber-500/30 shadow-md scale-100 opacity-100 hover:scale-105 hover:shadow-lg duration-300" 
                                : "bg-muted/30 border-muted opacity-40 grayscale"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${badge.color} text-white flex items-center justify-center text-xl shadow-inner mb-2`}>
                              {badge.icon}
                            </div>
                            <p className="font-bold text-xs truncate max-w-full text-foreground">{badge.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{badge.points} Points</p>
                            <Badge variant={isUnlocked ? "default" : "secondary"} className="mt-2 text-[9px] px-1.5 py-0">
                              {isUnlocked ? "Unlocked" : "Locked"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Sub tabs in participate */}
                <Tabs defaultValue="events" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3 max-w-md bg-white/40 border p-1 rounded-lg">
                    <TabsTrigger value="events" className="text-[10px] sm:text-xs md:text-sm py-1.5">
                      <span className="hidden sm:inline">Events Catalog</span>
                      <span className="sm:hidden">Catalog</span>
                    </TabsTrigger>
                    <TabsTrigger value="clubs" className="text-[10px] sm:text-xs md:text-sm py-1.5">Clubs</TabsTrigger>
                    <TabsTrigger value="my-events" className="text-[10px] sm:text-xs md:text-sm py-1.5">
                      <span className="hidden sm:inline">Registered ({myRegistrations.length})</span>
                      <span className="sm:hidden">Mine ({myRegistrations.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Catalog */}
                  <TabsContent value="events" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 pb-2 w-full sm:max-w-2xl">
                      <Input
                        placeholder="Search catalog by name or description..."
                        value={participateSearch}
                        onChange={(e) => setParticipateSearch(e.target.value)}
                        className="bg-white/80 backdrop-blur-sm border-slate-200 flex-1"
                      />
                      <Select value={participateClubFilter} onValueChange={setParticipateClubFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white/80 backdrop-blur-sm">
                          <SelectValue placeholder="Filter by Club" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Clubs</SelectItem>
                          {allClubs.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredParticipateEvents.filter(e => new Date(e.event_date) >= new Date()).length === 0 ? (
                        <Card className="col-span-full bg-white/70 border border-white/50 backdrop-blur-sm">
                          <CardContent className="py-8 text-center text-muted-foreground">
                            No upcoming events found matching your search.
                          </CardContent>
                        </Card>
                      ) : (
                        filteredParticipateEvents
                          .filter(e => new Date(e.event_date) >= new Date())
                          .map((event) => (
                          <Card key={event.id} className={`bg-white/70 border border-white/50 border-l-4 ${event.category?.toLowerCase() === 'technical' ? 'border-l-blue-500' : event.category?.toLowerCase() === 'cultural' ? 'border-l-purple-500' : event.category?.toLowerCase() === 'sports' ? 'border-l-emerald-500' : 'border-l-amber-500'} backdrop-blur-sm shadow-card hover:shadow-button hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between`}>
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-base sm:text-lg truncate">{event.name}</CardTitle>
                                  <CardDescription className="flex items-center gap-1 mt-1 text-xs sm:text-sm">
                                    <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="truncate">{event.clubs?.name}</span>
                                  </CardDescription>
                                </div>
                                <Badge className="bg-gradient-primary text-white text-xs shrink-0">{event.category}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 mt-auto">
                              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{event.description}</p>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 pt-2">
                                <div className="text-[11px] sm:text-xs text-slate-500">
                                  <p className="font-semibold text-slate-700">{new Date(event.event_date).toLocaleDateString()} at {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  <p>{event.duration} mins • {event.credit_points} pts</p>
                                </div>
                                <Button size="sm" onClick={() => showConfirmRegisterDialog(event.id)} className="w-full sm:w-auto bg-gradient-primary">
                                  Register
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </TabsContent>

                  {/* Clubs Catalog */}
                  <TabsContent value="clubs" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allClubs.map((club, idx) => (
                      <Card key={club.id} className={`bg-gradient-to-br ${clubGradients[idx % clubGradients.length]} backdrop-blur-md border shadow-card flex flex-col justify-between hover:shadow-button hover:scale-[1.01] transition-all duration-300`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm line-clamp-3">{club.description}</CardDescription>
                        </CardHeader>
                        {club.coordinators && club.coordinators.length > 0 && (
                          <CardContent className="pt-0 pb-5 text-sm text-muted-foreground mt-auto">
                            <div className="border-t border-slate-200/50 pt-3 space-y-3">
                              <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-sans">Club Coordinators</p>
                              <div className="space-y-2">
                                {club.coordinators.map((coord: any, index: number) => (
                                  <div key={index} className="space-y-0.5 border-l-2 border-primary/50 pl-2">
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="font-medium text-slate-900 text-xs sm:text-sm">{coord.name}</span>
                                    </div>
                                    {coord.phone && (
                                      <div className="flex items-center gap-1.5 pl-5">
                                        <Phone className="w-3 h-3 text-secondary shrink-0" />
                                        <span className="text-[11px] sm:text-xs text-slate-600">{coord.phone}</span>
                                      </div>
                                    )}
                                    {coord.email && (
                                      <div className="flex items-center gap-1.5 pl-5 min-w-0">
                                        <Mail className="w-3 h-3 text-accent shrink-0" />
                                        <span className="text-[11px] sm:text-xs text-slate-600 truncate min-w-0 flex-1">{coord.email}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Registered events */}
                  <TabsContent value="my-events" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myRegistrations.length === 0 ? (
                      <Card className="col-span-full bg-white/70 border border-white/50 backdrop-blur-sm">
                        <CardContent className="py-8 text-center text-muted-foreground">
                          You haven't registered for any events yet.
                        </CardContent>
                      </Card>
                    ) : (
                      myRegistrations.map((reg) => (
                        <Card key={reg.id} className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg truncate">{reg.events?.name}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate">{reg.events?.clubs?.name}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 mt-auto">
                            <div className="flex flex-wrap justify-between items-center gap-2 border-t border-slate-100 pt-3">
                              <div className="space-y-1">
                                {reg.is_volunteer ? (
                                  <Badge className="text-xs bg-amber-500 hover:bg-amber-600 text-white">
                                    Volunteer
                                  </Badge>
                                ) : (
                                  <Badge variant={reg.attendance_confirmed ? "default" : "secondary"} className="text-xs">
                                    {reg.attendance_confirmed ? "Attended" : "Registered"}
                                  </Badge>
                                )}
                                {reg.points_awarded > 0 && (
                                  <p className="text-xs text-slate-500">Points Awarded: {reg.points_awarded}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {reg.qr_code && !reg.attendance_confirmed && (
                                  <Button size="sm" variant="outline" onClick={() => showQrCode(reg.qr_code)} className="h-8 text-xs border-slate-200">
                                    View QR
                                  </Button>
                                )}
                                {reg.attendance_confirmed && (
                                  <Button size="sm" onClick={() => handleDownloadCertificate(reg)} className="h-8 gap-1.5 text-xs bg-gradient-primary">
                                    <Download className="w-3.5 h-3.5" /> Certificate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefresh>

      {/* AlertDialog: Confirm Registration */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Event Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register for this event? You'll receive a QR code for attendance verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegisterEvent} className="bg-gradient-primary">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: QR Code display */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Event QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code to the coordinator for attendance verification.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <QRCodeSVG value={selectedQrCode} size={200} level="H" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Notifications */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-xl flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              Keep track of recent events you or other coordinators have published.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {unreadCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                <BellOff className="w-10 h-10 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-sm font-medium">No new notifications</p>
                <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <p className="text-xs font-semibold text-muted-foreground">{unreadCount} Active Notifications</p>
                  <Button variant="ghost" size="sm" onClick={handleDismissAllNotifications} className="text-xs h-8 px-2">
                    Dismiss All
                  </Button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
                  {activeNotifications.map((notif) => (
                    <Card key={notif.id} className="p-3.5 relative hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start gap-2 pr-6">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDismissNotification(notif.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoordinatorDashboard;

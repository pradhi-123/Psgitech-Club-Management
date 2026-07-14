import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/apiClient";
import { LogOut, Plus, Users, Calendar, Award, Pencil, Trash2, User, Phone, Mail, Trash, Eye, EyeOff, FileText, Download, Upload, ChevronsUpDown, Check, GraduationCap, BookOpen, Building2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import collegeLogo from "@/assets/college-logo.png";
import PullToRefresh from "react-simple-pull-to-refresh";

const clubGradients = [
  "from-blue-500/10 to-cyan-500/10 border-cyan-500/30 text-cyan-950",
  "from-purple-500/10 to-pink-500/10 border-pink-500/30 text-pink-950",
  "from-amber-500/10 to-orange-500/10 border-orange-500/30 text-amber-950",
  "from-emerald-500/10 to-teal-500/10 border-teal-500/30 text-emerald-950",
  "from-rose-500/10 to-red-500/10 border-red-500/20 text-rose-950",
];

const AdminDashboard = () => {
  const { profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Form states
  const [clubForm, setClubForm] = useState({ name: "", description: "" });
  const [clubCoordinators, setClubCoordinators] = useState([{ name: "", phone: "", email: "", password: "", roll_number: "" }]);
  const [coordinatorForm, setCoordinatorForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    club_id: "",
    roll_number: "",
  });
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    email: "",
    roll_number: "",
    department: "",
    section: "",
    year: 1,
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Edit Club States
  const [isEditClubDialogOpen, setIsEditClubDialogOpen] = useState(false);
  const [selectedClubToEdit, setSelectedClubToEdit] = useState<any>(null);
  const [editClubForm, setEditClubForm] = useState({ name: "", description: "" });
  const [editClubCoordinators, setEditClubCoordinators] = useState([{ name: "", phone: "", email: "", password: "", roll_number: "" }]);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [visibleEditPasswords, setVisibleEditPasswords] = useState<Record<number, boolean>>({});
  const [openCoordCombo, setOpenCoordCombo] = useState<Record<number, boolean>>({});
  const [openEditCoordCombo, setOpenEditCoordCombo] = useState<Record<number, boolean>>({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAddClubOpen, setIsAddClubOpen] = useState(false);
  const [isAddCoordinatorOpen, setIsAddCoordinatorOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [bulkParsedStudents, setBulkParsedStudents] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Search, Filter, Sort States
  const [clubsSearch, setClubsSearch] = useState("");
  const [coordsSearch, setCoordsSearch] = useState("");
  const [coordsClubFilter, setCoordsClubFilter] = useState("all");
  const [studentsSearch, setStudentsSearch] = useState("");
  const [studentsDeptFilter, setStudentsDeptFilter] = useState("all");
  const [studentsYearFilter, setStudentsYearFilter] = useState("all");
  const [eventsSearch, setEventsSearch] = useState("");
  const [eventsClubFilter, setEventsClubFilter] = useState("all");
  const [eventsSortOrder, setEventsSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "admin")) {
      navigate("/login");
    }
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [clubsData, coordinatorsData, studentsData, eventsData] = await Promise.all([
        api.get("/api/clubs"),
        api.get("/api/auth/users/coordinators"),
        api.get("/api/auth/users/students"),
        api.get("/api/events"),
      ]);

      setClubs(clubsData || []);
      setCoordinators(coordinatorsData || []);
      setStudents(studentsData || []);
      setEvents(eventsData || []);
    } catch (err: any) {
      toast.error("Failed to load dashboard data: " + err.message);
    }
  };

  const handleAddCoordinatorRow = () => {
    setClubCoordinators(prev => [...prev, { name: "", phone: "", email: "", password: "", roll_number: "" }]);
  };

  const handleRemoveCoordinatorRow = (index: number) => {
    setClubCoordinators(prev => prev.filter((_, i) => i !== index));
  };

  // Update a single field for one coordinator row (Add Club)
  const handleCoordinatorChange = (index: number, field: string, value: string) => {
    setClubCoordinators(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update multiple fields at once for one coordinator row (Add Club) - avoids stale state
  const handleCoordinatorBatchChange = (index: number, fields: Partial<{ name: string; phone: string; email: string; password: string; roll_number: string }>) => {
    setClubCoordinators(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  const handleEditAddCoordinatorRow = () => {
    setEditClubCoordinators(prev => [...prev, { name: "", phone: "", email: "", password: "", roll_number: "" }]);
  };

  const handleEditRemoveCoordinatorRow = (index: number) => {
    setEditClubCoordinators(prev => prev.filter((_, i) => i !== index));
  };

  // Update a single field for one coordinator row (Edit Club)
  const handleEditCoordinatorChange = (index: number, field: string, value: string) => {
    setEditClubCoordinators(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update multiple fields at once for one coordinator row (Edit Club) - avoids stale state
  const handleEditCoordinatorBatchChange = (index: number, fields: Partial<{ name: string; phone: string; email: string; password: string; roll_number: string }>) => {
    setEditClubCoordinators(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  const handleStartEditClub = (club: any) => {
    setSelectedClubToEdit(club);
    setEditClubForm({ name: club.name || "", description: club.description || "" });
    setEditClubCoordinators(club.coordinators && club.coordinators.length > 0
      ? club.coordinators.map((c: any) => {
        const coordUser = coordinators.find(user =>
          (user.email && user.email.toLowerCase() === c.email?.toLowerCase()) ||
          (user.roll_number && user.roll_number.toUpperCase() === c.roll_number?.toUpperCase())
        );
        return {
          name: c.name || coordUser?.full_name || "",
          phone: c.phone && c.phone !== 'Unavailable' ? c.phone : (coordUser?.phone && coordUser.phone !== 'Unavailable' ? coordUser.phone : ""),
          email: c.email && c.email !== 'Unavailable' ? c.email : (coordUser?.email && coordUser.email !== 'Unavailable' ? coordUser.email : ""),
          password: coordUser?.plain_password || "astro123",
          roll_number: c.roll_number || coordUser?.roll_number || ""
        };
      })
      : [{ name: "", phone: "", email: "", password: "", roll_number: "" }]
    );
    setIsEditClubDialogOpen(true);
  };

  const handleSaveEditClub = async () => {
    if (!editClubForm.name) {
      toast.error("Club Name is required");
      return;
    }

    // Filter out rows without a name
    const validCoordinators = editClubCoordinators.filter(c => c.name.trim().length > 0);

    try {
      await api.put(`/api/clubs/edit/${selectedClubToEdit.id}`, {
        name: editClubForm.name,
        description: editClubForm.description,
        coordinators: validCoordinators
      });
      toast.success("Club updated successfully!");
      setIsEditClubDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Failed to update club: " + err.message);
    }
  };

  const handleAddClub = async () => {
    if (!clubForm.name.trim()) {
      toast.error("Club name is required");
      return;
    }

    try {
      await api.post("/api/clubs", {
        name: clubForm.name,
        description: clubForm.description,
        coordinators: clubCoordinators.filter(c => c.name.trim() !== "")
      });

      toast.success("Club added successfully!");
      setIsAddClubOpen(false);
      setClubForm({ name: "", description: "" });
      setClubCoordinators([{ name: "", phone: "", email: "", password: "", roll_number: "" }]);
      setVisiblePasswords({});
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add club: " + error.message);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/clubs/${clubId}`);
      toast.success("Club deleted successfully!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete club: " + error.message);
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

  const handleExportEventsCSV = () => {
    // Generate CSV content
    const headers = ["Event Name", "Club Name", "Coordinator", "Category", "Date", "Duration (mins)", "Registrations", "Attended"];
    const rows = events.map(e => [
      `"${e.name.replace(/"/g, '""')}"`,
      `"${(e.clubs?.name || '').replace(/"/g, '""')}"`,
      `"${(e.profiles?.full_name || '').replace(/"/g, '""')}"`,
      `"${e.category || ''}"`,
      new Date(e.event_date).toISOString().split('T')[0],
      e.duration,
      e.registered_count || 0,
      e.attended_count || 0
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `annual_events_report_${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Annual events report exported successfully!");
  };

  const handleAddCoordinator = async () => {
    if (!coordinatorForm.roll_number || !coordinatorForm.password || !coordinatorForm.full_name) {
      toast.error("Please enter a roll number and password for the coordinator");
      return;
    }
    try {
      await api.post("/api/auth/users", {
        email: coordinatorForm.email || `${coordinatorForm.roll_number.toLowerCase()}@psgitech.ac.in`,
        password: coordinatorForm.password,
        full_name: coordinatorForm.full_name,
        role: "coordinator",
        club_id: coordinatorForm.club_id,
        phone: coordinatorForm.phone,
        roll_number: coordinatorForm.roll_number.toUpperCase().trim()
      });

      toast.success("Coordinator added successfully!");
      setIsAddCoordinatorOpen(false);
      setCoordinatorForm({ full_name: "", phone: "", email: "", password: "", club_id: "", roll_number: "" });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add coordinator: " + error.message);
    }
  };

  const handleAddStudent = async () => {
    if (!studentForm.full_name || !studentForm.roll_number) {
      toast.error("Please fill in all required fields (Full Name and Roll Number)");
      return;
    }
    try {
      await api.post("/api/auth/users", {
        email: studentForm.email || `${studentForm.roll_number.toLowerCase()}@psgitech.ac.in`,
        password: studentForm.roll_number,
        full_name: studentForm.full_name,
        role: "student",
        roll_number: studentForm.roll_number,
        department: studentForm.department,
        section: studentForm.section,
        year: studentForm.year,
      });

      toast.success("Student added successfully!");
      setIsAddStudentOpen(false);
      setStudentForm({
        full_name: "",
        email: "",
        roll_number: "",
        department: "",
        section: "",
        year: 1,
      });
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add student: " + error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploadError("");
    setBulkParsedStudents([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          setBulkUploadError("File is empty");
          return;
        }

        let parsedRows: any[] = [];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === "csv") {
          const text = new TextDecoder().decode(data as ArrayBuffer);
          const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
          if (lines.length < 2) {
            setBulkUploadError("File must contain a header row and at least one data row");
            return;
          }

          const delimiter = lines[0].includes(";") ? ";" : ",";
          const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

          const headerMap: Record<string, string> = {
            "name": "full_name",
            "full name": "full_name",
            "fullname": "full_name",
            "full_name": "full_name",
            "roll": "roll_number",
            "roll number": "roll_number",
            "rollnumber": "roll_number",
            "roll_number": "roll_number",
            "email": "email",
            "email address": "email",
            "email_address": "email",
            "mail": "email",
            "department": "department",
            "dept": "department",
            "section": "section",
            "sec": "section",
            "year": "year",
            "phone": "phone",
            "phone number": "phone",
            "phone_number": "phone",
            "mobile": "phone"
          };

          const mappedHeaders = headers.map(h => headerMap[h] || h);

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^['"]|['"]$/g, ""));
            if (values.length < 2) continue;

            const studentObj: any = {};
            mappedHeaders.forEach((header, index) => {
              if (index < values.length) {
                studentObj[header] = values[index];
              }
            });
            parsedRows.push(studentObj);
          }
        } else {
          const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

          if (jsonData.length < 2) {
            setBulkUploadError("Excel sheet must contain a header row and at least one data row");
            return;
          }

          const rawHeaders = (jsonData[0] as any[]).map(h => String(h || "").trim().toLowerCase());

          const headerMap: Record<string, string> = {
            "name": "full_name",
            "full name": "full_name",
            "fullname": "full_name",
            "full_name": "full_name",
            "roll": "roll_number",
            "roll number": "roll_number",
            "rollnumber": "roll_number",
            "roll_number": "roll_number",
            "email": "email",
            "email address": "email",
            "email_address": "email",
            "mail": "email",
            "department": "department",
            "dept": "department",
            "section": "section",
            "sec": "section",
            "year": "year",
            "phone": "phone",
            "phone number": "phone",
            "phone_number": "phone",
            "mobile": "phone"
          };

          const mappedHeaders = rawHeaders.map(h => headerMap[h] || h);

          for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as any[];
            if (!rowData || rowData.length === 0) continue;

            const studentObj: any = {};
            mappedHeaders.forEach((header, index) => {
              if (index < rowData.length) {
                studentObj[header] = String(rowData[index] || "").trim();
              }
            });
            parsedRows.push(studentObj);
          }
        }

        const cleanedRows = parsedRows.filter(row => {
          return row.full_name && row.email && row.roll_number;
        }).map(row => {
          row.year = row.year ? parseInt(row.year) : 1;
          if (isNaN(row.year)) row.year = 1;
          return row;
        });

        if (cleanedRows.length === 0) {
          setBulkUploadError("Could not find any valid student rows. Headers must contain Name, Roll Number, and Email.");
        } else {
          setBulkParsedStudents(cleanedRows);
        }
      } catch (err: any) {
        setBulkUploadError("Failed to parse sheet: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImportSubmit = async () => {
    if (bulkParsedStudents.length === 0) return;

    setIsImporting(true);
    try {
      const response = await api.post("/api/auth/users/bulk", { students: bulkParsedStudents });
      const { createdCount, skippedCount } = response;
      toast.success(`Successfully imported ${createdCount} students. Skipped ${skippedCount} duplicates/invalid rows.`);
      setIsBulkUploadOpen(false);
      setBulkParsedStudents([]);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to complete bulk import: " + (error.response?.data?.message || error.message));
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditUser = (user: any) => {
    const fallbackPassword = user.plain_password || (user.role === "student" ? user.roll_number : "astro123");

    // For coordinators, also check club coordinator data for the latest email
    let bestEmail = user.email;
    if (user.role === "coordinator" && user.roll_number) {
      for (const club of clubs) {
        const matched = club.coordinators?.find((c: any) =>
          String(c.roll_number || '').toUpperCase().trim() === String(user.roll_number || '').toUpperCase().trim()
        );
        if (matched?.email && matched.email !== 'Unavailable') {
          // Prefer the club's coordinator email if the user profile email is auto-generated or unavailable
          if (!bestEmail || bestEmail === 'Unavailable' || bestEmail.endsWith('@psgitech.ac.in')) {
            bestEmail = matched.email;
          }
          break;
        }
      }
    }

    setEditingUser({
      ...user,
      email: bestEmail,
      plain_password: fallbackPassword,
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await api.put(`/api/auth/users/${editingUser.id}`, {
        full_name: editingUser.full_name,
        email: editingUser.email,
        roll_number: editingUser.roll_number,
        department: editingUser.department,
        section: editingUser.section,
        year: editingUser.year,
        phone: editingUser.phone,
        password: editingUser.plain_password,
        club_id: editingUser.club_id
      });

      toast.success("User updated successfully!");
      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update user: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await api.delete(`/api/auth/users/${deleteUserId}`);

      toast.success("User deleted successfully!");
      setDeleteUserId(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete user: " + error.message);
    }
  };

  // Filter computations
  const filteredClubs = clubs.filter(club =>
    club.name?.toLowerCase().includes(clubsSearch.toLowerCase()) ||
    club.description?.toLowerCase().includes(clubsSearch.toLowerCase())
  );

  const filteredCoords = coordinators.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(coordsSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(coordsSearch.toLowerCase());
    const matchesClub = coordsClubFilter === "all" || c.club_id === coordsClubFilter;
    return matchesSearch && matchesClub;
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(studentsSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentsSearch.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(studentsSearch.toLowerCase());
    const matchesDept = studentsDeptFilter === "all" || s.department === studentsDeptFilter;
    const matchesYear = studentsYearFilter === "all" || s.year?.toString() === studentsYearFilter;
    return matchesSearch && matchesDept && matchesYear;
  });

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes(eventsSearch.toLowerCase()) ||
      e.description?.toLowerCase().includes(eventsSearch.toLowerCase());
    const matchesClub = eventsClubFilter === "all" || e.club_id === eventsClubFilter;
    return matchesSearch && matchesClub;
  }).sort((a, b) => {
    const dateA = new Date(a.event_date).getTime();
    const dateB = new Date(b.event_date).getTime();
    return eventsSortOrder === "asc" ? dateA - dateB : dateB - dateA;
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
        <div className="min-h-screen bg-gradient-to-tr from-blue-100 via-indigo-100 via-purple-100 to-amber-100">
          {/* Header */}
          <header className="bg-gradient-primary text-white shadow-lg">
            <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <img src={collegeLogo} alt="College Logo" className="h-8 sm:h-12 md:h-16 w-auto object-contain flex-shrink-0 max-w-[180px] sm:max-w-xs" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-white/80 text-xs sm:text-sm mt-0.5">Manage clubs, coordinators, and students</p>
                  </div>
                </div>
                <Button onClick={signOut} variant="secondary" size="sm" className="gap-1.5 self-end sm:self-auto">
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
                  <Award className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{clubs.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Coordinators</CardTitle>
                  <Users className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{coordinators.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{students.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 border border-white/50 backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{events.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="clubs" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-4 max-w-full sm:max-w-2xl text-[11px] sm:text-sm h-10 sm:h-11">
                <TabsTrigger value="clubs" className="px-1.5 py-1">Clubs</TabsTrigger>
                <TabsTrigger value="coordinators" className="px-1.5 py-1">
                  <span className="hidden sm:inline">Coordinators</span>
                  <span className="sm:hidden">Coords</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="px-1.5 py-1">Students</TabsTrigger>
                <TabsTrigger value="events" className="px-1.5 py-1">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="clubs" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Clubs</h2>
                  <Dialog open={isAddClubOpen} onOpenChange={(open) => {
                    if (!open) {
                      setClubForm({ name: "", description: "" });
                      setClubCoordinators([{ name: "", phone: "", email: "", password: "", roll_number: "" }]);
                      setVisiblePasswords({});
                    }
                    setIsAddClubOpen(open);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Add Club
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <DialogHeader>
                        <DialogTitle>Add New Club</DialogTitle>
                        <DialogDescription>Create a new club for students to join</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="clubName">Club Name</Label>
                          <Input
                            id="clubName"
                            value={clubForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClubForm({ ...clubForm, name: e.target.value })}
                            placeholder="e.g., Coding Club"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clubDesc">Description</Label>
                          <Textarea
                            id="clubDesc"
                            value={clubForm.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClubForm({ ...clubForm, description: e.target.value })}
                            placeholder="Enter club description"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold">Club Coordinators</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddCoordinatorRow} className="text-xs h-7 gap-1">
                              <Plus className="w-3 h-3" /> Add Coordinator
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {clubCoordinators.map((coord, index) => (
                              <div key={index} className="p-3 border rounded-lg space-y-2 relative bg-muted/25">
                                {clubCoordinators.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveCoordinatorRow(index)}
                                    className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {/* Student search combobox */}
                                <div className="space-y-1">
                                  <Label className="text-xs">Select Student *</Label>
                                  <Popover
                                    open={openCoordCombo[index] || false}
                                    onOpenChange={(open) => setOpenCoordCombo(prev => ({ ...prev, [index]: open }))}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full h-8 text-xs justify-between font-normal truncate"
                                      >
                                        <span className="truncate">
                                          {coord.name ? `${coord.name} (${coord.roll_number})` : "Search by name or roll number..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0 z-[200]" align="start">
                                      <Command>
                                        <CommandInput placeholder="Type name or roll no..." className="h-8 text-xs" />
                                        <CommandList>
                                          <CommandEmpty className="text-xs py-3 text-center text-muted-foreground">No student found.</CommandEmpty>
                                          <CommandGroup>
                                            {students.map((s) => (
                                              <CommandItem
                                                key={s.id || s._id}
                                                value={`${s.full_name} ${s.roll_number}`}
                                                onSelect={() => {
                                                  handleCoordinatorBatchChange(index, {
                                                    roll_number: s.roll_number,
                                                    name: s.full_name,
                                                    email: (!s.email || s.email === 'Unavailable' || s.email.endsWith('@psgitech.ac.in')) ? "" : s.email,
                                                    phone: s.phone === 'Unavailable' ? "" : (s.phone || ""),
                                                    password: s.plain_password || s.roll_number || "",
                                                  });
                                                  setOpenCoordCombo(prev => ({ ...prev, [index]: false }));
                                                }}
                                                className="text-xs"
                                              >
                                                <Check className={`mr-2 h-3 w-3 ${coord.roll_number === s.roll_number ? 'opacity-100' : 'opacity-0'}`} />
                                                <span className="font-medium">{s.full_name}</span>
                                                <span className="ml-2 text-muted-foreground">{s.roll_number}</span>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                {/* Editable fields - shown after student selected */}
                                <div className="space-y-1">
                                  <Label className="text-xs">Coordinator Name *</Label>
                                  <Input
                                    value={coord.name || ""}
                                    onChange={(e) => handleCoordinatorChange(index, 'name', e.target.value)}
                                    placeholder="Auto-filled or type manually"
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Phone Number</Label>
                                  <Input
                                    value={coord.phone === "Unavailable" ? "" : (coord.phone || "")}
                                    onChange={(e) => handleCoordinatorChange(index, 'phone', e.target.value)}
                                    placeholder="Enter phone number"
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Email Address</Label>
                                  <Input
                                    value={coord.email === "Unavailable" ? "" : (coord.email || "")}
                                    onChange={(e) => handleCoordinatorChange(index, 'email', e.target.value)}
                                    placeholder="Enter email address"
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Password *</Label>
                                  <Input
                                    type="text"
                                    value={coord.password || ""}
                                    onChange={(e) => handleCoordinatorChange(index, 'password', e.target.value)}
                                    placeholder="Set coordinator password"
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button onClick={handleAddClub} className="w-full">
                          Add Club
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="w-full max-w-sm pb-2">
                  <Input
                    placeholder="Search clubs by name or description..."
                    value={clubsSearch}
                    onChange={(e) => setClubsSearch(e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClubs.map((club, idx) => (
                    <Card key={club.id} className={`bg-gradient-to-br ${clubGradients[idx % clubGradients.length]} backdrop-blur-md border shadow-card flex flex-col justify-between hover:shadow-button hover:scale-[1.01] transition-all duration-300`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">{club.name}</CardTitle>
                            {club.description && <CardDescription className="mt-1.5 text-xs sm:text-sm line-clamp-3">{club.description}</CardDescription>}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" size="icon" onClick={() => handleStartEditClub(club)} className="h-8 w-8" title="Edit Club">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteClub(club.id)} className="h-8 w-8" title="Delete Club">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {club.coordinators && club.coordinators.length > 0 && (
                        <CardContent className="pt-0 pb-5 text-sm text-muted-foreground mt-auto">
                          <div className="border-t border-muted/65 pt-3 space-y-3.5">
                            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Club Coordinators</p>
                            <div className="space-y-3">
                              {club.coordinators.map((coord: any, idx: number) => (
                                <div key={idx} className="space-y-1 border-l-2 border-primary/50 pl-2">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="font-medium text-foreground text-xs sm:text-sm">{coord.name}</span>
                                  </div>
                                  {coord.phone && (
                                    <div className="flex items-center gap-2 pl-5">
                                      <Phone className="w-3 h-3 text-secondary shrink-0" />
                                      <span className="text-[11px] sm:text-xs">{coord.phone}</span>
                                    </div>
                                  )}
                                  {coord.email && (
                                    <div className="flex items-center gap-2 pl-5 min-w-0">
                                      <Mail className="w-3 h-3 text-accent shrink-0" />
                                      <span className="text-[11px] sm:text-xs truncate min-w-0 flex-1">{coord.email}</span>
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
              </TabsContent>

              <TabsContent value="coordinators" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Coordinators</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setIsSummaryOpen(true)}>
                      <FileText className="w-4 h-4" /> Events Summary
                    </Button>
                    <Dialog open={isAddCoordinatorOpen} onOpenChange={setIsAddCoordinatorOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" /> Add Coordinator
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Coordinator</DialogTitle>
                          <DialogDescription>Create a coordinator and assign to a club</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2 relative">
                            <Label>Student Roll Number *</Label>
                            <Input
                              value={coordinatorForm.roll_number || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const inputRoll = e.target.value.toUpperCase();
                                const foundStudent = students.find(s => String(s.roll_number || '').toUpperCase().trim() === inputRoll.trim());

                                let foundClubCoord = null;
                                let foundClubId = "";
                                for (const club of clubs) {
                                  const matched = club.coordinators?.find(c => String(c.roll_number || '').toUpperCase().trim() === inputRoll.trim());
                                  if (matched) {
                                    foundClubCoord = matched;
                                    foundClubId = club.id;
                                    break;
                                  }
                                }

                                if (foundStudent || foundClubCoord) {
                                  const matchedName = foundStudent?.full_name || foundClubCoord?.name || "";
                                  const matchedPhone = foundStudent?.phone || foundClubCoord?.phone || "";
                                  const matchedEmail = foundStudent?.email || foundClubCoord?.email || `${inputRoll.toLowerCase()}@psgitech.ac.in`;

                                  setCoordinatorForm({
                                    ...coordinatorForm,
                                    roll_number: inputRoll,
                                    full_name: matchedName,
                                    phone: matchedPhone === "Unavailable" ? "" : matchedPhone,
                                    email: matchedEmail === "Unavailable" ? "" : matchedEmail,
                                    club_id: foundClubId || coordinatorForm.club_id,
                                    password: coordinatorForm.password || foundStudent?.plain_password || foundStudent?.roll_number || ""
                                  });
                                } else {
                                  setCoordinatorForm({
                                    ...coordinatorForm,
                                    roll_number: inputRoll,
                                    full_name: "",
                                    phone: "",
                                    email: `${inputRoll.toLowerCase()}@psgitech.ac.in`
                                  });
                                }
                              }}
                              placeholder="Enter Student Roll Number"
                            />
                            {coordinatorForm.roll_number && coordinatorForm.roll_number.length >= 2 && !coordinatorForm.full_name && (
                              <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-[150px] overflow-y-auto divide-y divide-slate-100 text-xs">
                                {students
                                  .filter(s =>
                                    String(s.roll_number || '').toUpperCase().includes(coordinatorForm.roll_number.toUpperCase()) ||
                                    s.full_name?.toUpperCase().includes(coordinatorForm.roll_number.toUpperCase())
                                  )
                                  .slice(0, 5)
                                  .map((s) => (
                                    <div
                                      key={s.id || s._id}
                                      className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between bg-white text-slate-800"
                                      onMouseDown={() => {
                                        let foundClubCoord = null;
                                        let foundClubId = "";
                                        for (const club of clubs) {
                                          const matched = club.coordinators?.find(c => String(c.roll_number || '').toUpperCase().trim() === String(s.roll_number || '').toUpperCase().trim());
                                          if (matched) {
                                            foundClubCoord = matched;
                                            foundClubId = club.id;
                                            break;
                                          }
                                        }

                                        const matchedPhone = s.phone || foundClubCoord?.phone || "";
                                        const matchedEmail = s.email || foundClubCoord?.email || "";

                                        setCoordinatorForm({
                                          ...coordinatorForm,
                                          roll_number: s.roll_number,
                                          full_name: s.full_name,
                                          phone: matchedPhone === "Unavailable" ? "" : matchedPhone,
                                          email: matchedEmail === "Unavailable" ? "" : matchedEmail,
                                          club_id: foundClubId || coordinatorForm.club_id,
                                          password: s.plain_password || s.roll_number || ""
                                        });
                                      }}
                                    >
                                      <span className="font-semibold">{s.full_name}</span>
                                      <span className="text-slate-400">{s.roll_number}</span>
                                    </div>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={coordinatorForm.full_name || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCoordinatorForm({ ...coordinatorForm, full_name: e.target.value })
                              }
                              placeholder="Enter coordinator's full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              type="tel"
                              value={coordinatorForm.phone || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCoordinatorForm({ ...coordinatorForm, phone: e.target.value })
                              }
                              placeholder="Enter phone number (optional)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={coordinatorForm.email || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCoordinatorForm({ ...coordinatorForm, email: e.target.value })
                              }
                              placeholder="Enter email address (optional)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Set Password *</Label>
                            <Input
                              type="text"
                              value={coordinatorForm.password}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setCoordinatorForm({ ...coordinatorForm, password: e.target.value })
                              }
                              placeholder="Set password for coordinator"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Assign to Club</Label>
                            <Select
                              value={coordinatorForm.club_id}
                              onValueChange={(value: string) =>
                                setCoordinatorForm({ ...coordinatorForm, club_id: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a club" />
                              </SelectTrigger>
                              <SelectContent>
                                {clubs.map((club) => (
                                  <SelectItem key={club.id} value={club.id}>
                                    {club.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleAddCoordinator} className="w-full">
                            Add Coordinator
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pb-2 w-full sm:max-w-2xl">
                  <Input
                    placeholder="Search coordinators by name or email..."
                    value={coordsSearch}
                    onChange={(e) => setCoordsSearch(e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border-slate-200 flex-1"
                  />
                  <Select value={coordsClubFilter} onValueChange={setCoordsClubFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Filter by Club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      {clubs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredCoords.map((coordinator) => (
                    <Card key={coordinator.id} className="shadow-card bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50/30 border border-slate-200/60 border-l-4 border-l-blue-500/80 hover:shadow-md transition-all duration-300">
                      <CardHeader className="py-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <CardTitle className="text-base font-semibold text-slate-800">{coordinator.full_name}</CardTitle>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="font-medium">Roll Number:</span>
                                <span className="font-semibold text-slate-800">{coordinator.roll_number || "No Roll Number"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Mail className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                <span className="font-medium">Email:</span>
                                <span className="break-all font-semibold text-slate-800">{coordinator.email && coordinator.email !== "Unavailable" ? coordinator.email : "No Email"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="font-medium">Phone:</span>
                                <span className="font-semibold text-slate-800">{coordinator.phone && coordinator.phone !== "Unavailable" ? coordinator.phone : "No Phone"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold mt-2 pt-1 border-t border-indigo-100/50">
                                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Club Coordinator:</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] uppercase font-bold">{coordinator.club_name || "Unassigned"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEditUser(coordinator)}
                              className="h-8 w-8 hover:bg-white hover:text-indigo-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => setDeleteUserId(coordinator.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Students</h2>
                  <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Add Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Register a new student</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={studentForm.full_name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, full_name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Roll Number * (Also becomes password)</Label>
                          <Input
                            value={studentForm.roll_number}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, roll_number: e.target.value.toUpperCase() })
                            }
                            placeholder="e.g., 22AD001"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Input
                            value={studentForm.department}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, department: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Section</Label>
                          <Input
                            value={studentForm.section}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setStudentForm({ ...studentForm, section: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Select
                            value={studentForm.year.toString()}
                            onValueChange={(value: string) =>
                              setStudentForm({ ...studentForm, year: parseInt(value) })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddStudent} className="w-full">
                          Add Student
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pb-2 w-full sm:max-w-3xl">
                  <Input
                    placeholder="Search students by name, roll number..."
                    value={studentsSearch}
                    onChange={(e) => setStudentsSearch(e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border-slate-200 flex-1"
                  />
                  <Select value={studentsDeptFilter} onValueChange={setStudentsDeptFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Depts</SelectItem>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="ECE">ECE</SelectItem>
                      <SelectItem value="EEE">EEE</SelectItem>
                      <SelectItem value="MECH">MECH</SelectItem>
                      <SelectItem value="CIVIL">CIVIL</SelectItem>
                      <SelectItem value="AIDS">AIDS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={studentsYearFilter} onValueChange={setStudentsYearFilter}>
                    <SelectTrigger className="w-full sm:w-[120px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="shadow-card bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-slate-50/30 border border-slate-200/60 border-l-4 border-l-emerald-500/80 hover:shadow-md transition-all duration-300">
                      <CardHeader className="py-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <CardTitle className="text-base font-semibold text-slate-800">{student.full_name}</CardTitle>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-medium">Roll Number:</span>
                                <span className="font-semibold text-slate-800">{student.roll_number || "No Roll Number"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span className="font-medium">Department:</span>
                                <span className="font-semibold text-slate-800">{student.department || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="font-medium">Section:</span>
                                <span className="font-semibold text-slate-800">{student.section || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <GraduationCap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                <span className="font-medium">Academic Year:</span>
                                <span className="font-semibold text-slate-800">Year {student.year || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="font-medium">Phone:</span>
                                <span className="font-semibold text-slate-800">{student.phone && student.phone !== "Unavailable" ? student.phone : "No Phone"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleEditUser(student)}
                              className="h-8 w-8 hover:bg-white hover:text-emerald-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => setDeleteUserId(student.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">All Events</h2>
                  <Button variant="outline" className="gap-2" onClick={() => handleExportEventsCSV()}>
                    <Download className="w-4 h-4" /> Export Excel Report
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pb-2 w-full sm:max-w-3xl">
                  <Input
                    placeholder="Search events by name or description..."
                    value={eventsSearch}
                    onChange={(e) => setEventsSearch(e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border-slate-200 flex-1"
                  />
                  <Select value={eventsClubFilter} onValueChange={setEventsClubFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Filter by Club" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clubs</SelectItem>
                      {clubs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={eventsSortOrder} onValueChange={(val: "asc" | "desc") => setEventsSortOrder(val)}>
                    <SelectTrigger className="w-full sm:w-[150px] bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Sort Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Date (Newest)</SelectItem>
                      <SelectItem value="asc">Date (Oldest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className={`bg-white/70 border border-white/50 border-l-4 ${event.category?.toLowerCase() === 'technical' ? 'border-l-blue-500' : event.category?.toLowerCase() === 'cultural' ? 'border-l-purple-500' : event.category?.toLowerCase() === 'sports' ? 'border-l-emerald-500' : 'border-l-amber-500'} backdrop-blur-sm shadow-card hover:scale-[1.01] transition-all duration-300`}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate">{event.name}</CardTitle>
                            <CardDescription className="truncate">
                              {event.clubs?.name} • Coordinator: {event.profiles?.full_name}
                            </CardDescription>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="h-8 w-8 shrink-0"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.event_date).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PullToRefresh>

      {/* Event Annual Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Annual Events Summary Report</DialogTitle>
            <DialogDescription>List of all events organized up to {new Date().toLocaleDateString()}</DialogDescription>
          </DialogHeader>

          <div className="border rounded-md overflow-hidden bg-white mt-4">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                    <th className="p-3">Event Name</th>
                    <th className="p-3">Organising Club</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Registrations</th>
                    <th className="p-3 text-center">Attendees</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">No events found.</td>
                    </tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-medium text-slate-900">{e.name}</td>
                        <td className="p-3 text-slate-600">{e.clubs?.name || "College Club"}</td>
                        <td className="p-3 text-slate-500">{new Date(e.event_date).toLocaleDateString()}</td>
                        <td className="p-3 text-center font-semibold text-slate-600">{e.registered_count || 0}</td>
                        <td className="p-3 text-center font-semibold text-emerald-600">{e.attended_count || 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => handleExportEventsCSV()} className="gap-1.5">
              <Download className="w-4 h-4" /> Download Annual Report (Excel)
            </Button>
            <Button onClick={() => setIsSummaryOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={editingUser.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                />
              </div>
              {editingUser.role !== "student" && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingUser.email === "Unavailable" ? "" : (editingUser.email || "")}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    placeholder="Enter email address"
                  />
                </div>
              )}
              {editingUser.role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input
                      value={editingUser.roll_number || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, roll_number: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={editingUser.department || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, department: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Input
                      value={editingUser.section || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, section: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={editingUser.year?.toString()}
                      onValueChange={(value: string) =>
                        setEditingUser({ ...editingUser, year: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showEditPassword ? "text" : "password"}
                        value={editingUser.plain_password || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingUser({ ...editingUser, plain_password: e.target.value })
                        }
                        placeholder="Enter password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {editingUser.role === "coordinator" && (
                <>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input
                      value={editingUser.roll_number || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, roll_number: e.target.value.toUpperCase() })
                      }
                      placeholder="Enter student roll number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={editingUser.phone === "Unavailable" ? "" : (editingUser.phone || "")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingUser({ ...editingUser, phone: e.target.value })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign to Club</Label>
                    <Select
                      value={editingUser.club_id || "unassigned"}
                      onValueChange={(value: string) =>
                        setEditingUser({ ...editingUser, club_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showEditPassword ? "text" : "password"}
                        value={editingUser.plain_password || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingUser({ ...editingUser, plain_password: e.target.value })
                        }
                        placeholder="Enter password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleUpdateUser} className="w-full">
                Update User
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open: boolean) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Club Dialog */}
      <Dialog open={isEditClubDialogOpen} onOpenChange={setIsEditClubDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club: {selectedClubToEdit?.name}</DialogTitle>
            <DialogDescription>Modify club details and coordinators</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Club Name *</Label>
              <Input
                value={editClubForm.name}
                onChange={(e) => setEditClubForm({ ...editClubForm, name: e.target.value })}
                placeholder="Enter club name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editClubForm.description}
                onChange={(e) => setEditClubForm({ ...editClubForm, description: e.target.value })}
                placeholder="Enter club description"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Club Coordinators</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleEditAddCoordinatorRow} className="text-xs h-7 gap-1">
                  <Plus className="w-3 h-3" /> Add Coordinator
                </Button>
              </div>

              <div className="space-y-3">
                {editClubCoordinators.map((coord, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2 relative bg-muted/25">
                    {editClubCoordinators.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditRemoveCoordinatorRow(index)}
                        className="absolute top-1 right-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {/* Student search combobox */}
                    <div className="space-y-1">
                      <Label className="text-xs">Select Student *</Label>
                      <Popover
                        open={openEditCoordCombo[index] || false}
                        onOpenChange={(open) => setOpenEditCoordCombo(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-8 text-xs justify-between font-normal truncate"
                          >
                            <span className="truncate">
                              {coord.name ? `${coord.name} (${coord.roll_number})` : "Search by name or roll number..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 z-[200]" align="start">
                          <Command>
                            <CommandInput placeholder="Type name or roll no..." className="h-8 text-xs" />
                            <CommandList>
                              <CommandEmpty className="text-xs py-3 text-center text-muted-foreground">No student found.</CommandEmpty>
                              <CommandGroup>
                                {[...students, ...coordinators].filter((u, i, arr) =>
                                  arr.findIndex(x => x.roll_number === u.roll_number) === i
                                ).map((s) => (
                                  <CommandItem
                                    key={s.id || s._id}
                                    value={`${s.full_name} ${s.roll_number}`}
                                    onSelect={() => {
                                      handleEditCoordinatorBatchChange(index, {
                                        roll_number: s.roll_number,
                                        name: s.full_name,
                                        email: (!s.email || s.email === 'Unavailable' || s.email.endsWith('@psgitech.ac.in')) ? "" : s.email,
                                        phone: s.phone === 'Unavailable' ? "" : (s.phone || ""),
                                        password: coord.password || s.plain_password || s.roll_number || "",
                                      });
                                      setOpenEditCoordCombo(prev => ({ ...prev, [index]: false }));
                                    }}
                                    className="text-xs"
                                  >
                                    <Check className={`mr-2 h-3 w-3 ${coord.roll_number === s.roll_number ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="font-medium">{s.full_name}</span>
                                    <span className="ml-2 text-muted-foreground">{s.roll_number}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Editable fields */}
                    <div className="space-y-1">
                      <Label className="text-xs">Coordinator Name *</Label>
                      <Input
                        value={coord.name || ""}
                        onChange={(e) => handleEditCoordinatorChange(index, 'name', e.target.value)}
                        placeholder="Auto-filled or type manually"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone Number</Label>
                      <Input
                        value={coord.phone === "Unavailable" ? "" : (coord.phone || "")}
                        onChange={(e) => handleEditCoordinatorChange(index, 'phone', e.target.value)}
                        placeholder="Enter phone number"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email Address</Label>
                      <Input
                        value={coord.email === "Unavailable" ? "" : (coord.email || "")}
                        onChange={(e) => handleEditCoordinatorChange(index, 'email', e.target.value)}
                        placeholder="Enter email address"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Password *</Label>
                      <Input
                        type="text"
                        value={coord.password || ""}
                        onChange={(e) => handleEditCoordinatorChange(index, 'password', e.target.value)}
                        placeholder="Set coordinator password"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveEditClub} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;

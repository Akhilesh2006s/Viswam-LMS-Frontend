import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api-config";
import { ArrowLeft, Loader2 } from "lucide-react";

type SchoolDetailPayload = {
  profile?: {
    id?: string;
    name?: string;
    email?: string;
    schoolName?: string;
    board?: string;
    status?: string;
    place?: string;
    state?: string;
    joinDate?: string;
  };
  stats?: { students?: number; teachers?: number };
};

export default function SuperAdminSchoolDetail() {
  const [, params] = useRoute("/super-admin/schools/:id");
  const [, setLocation] = useLocation();
  const schoolId = params?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SchoolDetailPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      setLocation("/auth/login");
      return;
    }
    setLoading(true);
    fetch(`${API_BASE_URL}/api/super-admin/admins/${schoolId}/school-detail`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.message || "Failed to load school");
        setData(json.data);
        setError("");
      })
      .catch((e: Error) => setError(e.message || "Failed to load school"))
      .finally(() => setLoading(false));
  }, [schoolId, setLocation]);

  const profile = data?.profile;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Button variant="ghost" className="mb-4" onClick={() => setLocation("/super-admin/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to dashboard
      </Button>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading school…
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="space-y-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>{profile?.schoolName || profile?.name || "School"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Admin:</span> {profile?.name} ({profile?.email})
              </p>
              <p>
                <span className="font-medium">Board:</span> {profile?.board || "—"}
              </p>
              <p>
                <span className="font-medium">Location:</span>{" "}
                {[profile?.place, profile?.state].filter(Boolean).join(", ") || "—"}
              </p>
              <Badge variant={profile?.status === "Active" ? "default" : "secondary"}>
                {profile?.status || "Unknown"}
              </Badge>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{data?.stats?.students ?? 0}</p>
                <p className="text-sm text-gray-600">Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{data?.stats?.teachers ?? 0}</p>
                <p className="text-sm text-gray-600">Teachers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

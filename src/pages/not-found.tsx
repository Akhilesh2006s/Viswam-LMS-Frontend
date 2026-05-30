import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { PRODUCT_NAME } from "@/lib/brand";

export default function NotFound() {
  usePageTitle("Not Found");
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-gray-600">
            This page does not exist on {PRODUCT_NAME}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

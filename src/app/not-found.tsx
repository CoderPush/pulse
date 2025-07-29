"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-violet-100 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-blue-200">
        <CardHeader className="flex flex-col items-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 rounded-t-lg pb-4">
          <AlertTriangle className="w-12 h-12 text-teal-300 mb-2 drop-shadow-lg" />
          <CardTitle className="text-white text-2xl font-bold">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-8 pb-6 px-6 flex flex-col items-center">
          <div className="text-center space-y-2">
            <p className="text-gray-600 text-lg">
              Sorry, the page you're looking for doesn't exist.
            </p>
            <p className="text-gray-500 text-sm">
              The link might be broken, expired, or the page has been moved.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
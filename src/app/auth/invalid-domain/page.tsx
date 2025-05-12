import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function InvalidDomainPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-violet-100 to-teal-100 p-0">
      <Card className="w-full border-2 border-blue-200 rounded-none sm:rounded-lg sm:w-[480px] shadow-xl">
        <CardHeader className="flex flex-col items-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 rounded-t-none sm:rounded-t-lg pb-4">
          <ShieldAlert className="w-12 h-12 text-teal-300 mb-2 drop-shadow-lg" />
          <CardTitle className="text-white text-2xl font-bold">Invalid Email Domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-8 pb-6 px-4 sm:px-6 flex flex-col items-center w-full">
          <Alert className="w-full flex flex-col items-center bg-white border-l-4 border-violet-400 shadow-sm">
            <AlertTitle className="flex items-center gap-2 text-violet-700 font-semibold">
              <ShieldAlert className="w-5 h-5 text-violet-500" /> Access Denied
            </AlertTitle>
            <div className="mt-2 text-blue-800 text-center">
              You must sign in with your <span className="font-semibold text-indigo-600">@coderpush.com</span> email address.<br />
            </div>
          </Alert>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 rounded-lg shadow-md transition">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 
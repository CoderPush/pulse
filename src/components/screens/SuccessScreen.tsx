import { Check, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-6 px-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check size={32} className="text-green-600" />
      </div>
      
      <div>
        <h1 className="text-2xl font-bold mb-2">Submission received!</h1>
        <p className="text-gray-600 mb-6">You&apos;re helping us all stay in sync 🙌</p>
      </div>
      
      <div className="flex flex-col gap-3 w-full">
        {/* <div className="flex items-center justify-between bg-blue-50 p-4 rounded">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <span>Your streak</span>
          </div>
          <div className="font-bold">3 weeks</div>
        </div> */}
        
        <button 
          onClick={() => router.push('/history')}
          className="border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-full font-medium flex items-center gap-2 justify-center"
        >
          <FileText size={18} /> View My History
        </button>
      </div>
    </div>
  );
} 
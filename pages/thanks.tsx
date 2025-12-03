import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Thanks() {
  const router = useRouter();
  const { score, used } = router.query;
  
  const isUsed = used === 'true';

  return (
    <div className="min-h-screen bg-vrcore-gray flex flex-col font-sans text-gray-800">
      <Head>
        <title>Thank You - VRCORE Education</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Load Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Roboto:wght@500;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Header / Nav */}
      <header className="bg-vrcore-darkBlue text-white py-4 px-6 shadow-md">
        <div className="max-w-md mx-auto flex justify-center">
          {/* Logo Placeholder - styled text as per branding if image missing */}
          <div className="text-2xl font-heading font-bold tracking-tight">
            VRCORE <span className="font-light">Education</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-xl shadow-lg overflow-hidden border-t-4 border-vrcore-blue">
          <div className="p-8 text-center">
            
            {/* Icon / Status */}
            <div className="mb-6 flex justify-center">
              {isUsed ? (
                 <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
              ) : (
                <div className="h-16 w-16 bg-vrcore-lightBlue rounded-full flex items-center justify-center text-vrcore-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              {isUsed ? 'Feedback Already Recorded' : 'Thank You!'}
            </h1>
            
            <p className="text-gray-600 mb-6 font-sans">
              {isUsed 
                ? "You've already submitted your feedback for this session. We appreciate your input!"
                : "Your feedback has been successfully recorded."}
            </p>

            {score && !isUsed && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500 mb-1 uppercase tracking-wide font-semibold">You rated us</p>
                <div className="text-4xl font-bold text-vrcore-blue">{score}<span className="text-xl text-gray-400">/5</span></div>
              </div>
            )}

            <div className="space-y-4">
               <p className="text-sm text-gray-500 italic">
                Optional: You can reply to the email if you have any specific thoughts or comments to add.
               </p>
               
               <a 
                 href="https://vrcore.education" 
                 className="inline-block px-6 py-3 bg-vrcore-blue text-white font-medium rounded-lg hover:bg-vrcore-darkBlue transition-colors duration-200"
               >
                 Return to VRCORE
               </a>
            </div>
          </div>
          
          <div className="bg-gray-50 px-8 py-4 text-center">
             <p className="text-xs text-gray-400">
               &copy; {new Date().getFullYear()} VRCORE Education. All rights reserved.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}


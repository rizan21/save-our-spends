import { ArrowLeft, FileText } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export interface TermsOfServicePageProps {
  onBack: () => void;
}

export function TermsOfServicePage({ onBack }: TermsOfServicePageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs">
        <Logo size={52} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <FileText className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Save Our Spends (SoS) &bull; Effective Date: November 4, 2026
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300 shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Save Our Spends (&quot;the app&quot;), hosted at{' '}
            <a
              href="https://spends.notafakecloud.uk"
              className="text-emerald-600 dark:text-emerald-400 underline"
            >
              https://spends.notafakecloud.uk
            </a>
            , you agree to comply with and be bound by these Terms of Service. If you do not agree, do not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Description of the Service
          </h2>
          <p>
            Save Our Spends is an open-source, 100% client-side web application designed to help individuals and groups
            record shared expenses, track balances, and calculate debt simplifications using Google Sheets spreadsheets
            stored in their personal Google Drive accounts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            3. No Financial, Banking, or Legal Services
          </h2>
          <p>
            Save Our Spends is <strong>not a bank, payment processor, money transmitter, or financial advisor</strong>.
            The app does not handle, transfer, or process money. All splits, summaries, and debt minimizations are purely
            mathematical aids for peer expense sharing. Any actual money transfers occur off-platform directly between participants.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            4. User Responsibilities &amp; Spreadsheet Ownership
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You are responsible for safeguarding your Google account credentials.</li>
            <li>You retain complete ownership of all data stored in your Google Drive spreadsheets.</li>
            <li>You are solely responsible for configuring spreadsheet permissions and managing collaborator privileges.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            5. Disclaimer of Warranties (&quot;AS IS&quot;) &amp; Limitation of Liability
          </h2>
          <p>
            SAVE OUR SPENDS IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL
            THE AUTHORS OR CONTRIBUTORS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM OR IN CONNECTION
            WITH THE SOFTWARE.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            6. Contact Information
          </h2>
          <p className="text-xs sm:text-sm">
            <strong>Point of Contact:</strong> Rizan Farooqui<br />
            <strong>Email:</strong>{' '}
            <a href="mailto:rizanfarooqui@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline">
              rizanfarooqui@gmail.com
            </a>
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
        <a href="#privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Privacy Policy
        </a>{' '}
        &bull; Standalone HTML view:{' '}
        <a href="/terms.html" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          /terms.html
        </a>
      </div>
    </div>
  );
}

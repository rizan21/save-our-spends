import { ArrowLeft, Shield, ExternalLink } from 'lucide-react';
import { Logo } from '../../components/common/Logo';

export interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
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
              Privacy Policy
            </h1>
            <Shield className="w-5 h-5 text-emerald-500" />
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
            1. Overview &amp; 100% Client-Side Architecture
          </h2>
          <p>
            <strong>Save Our Spends</strong> (&quot;SoS&quot;), accessible at{' '}
            <a
              href="https://spends.notafakecloud.uk"
              className="text-emerald-600 dark:text-emerald-400 underline"
            >
              https://spends.notafakecloud.uk
            </a>
            , is a decentralized expense sharing Progressive Web App.
          </p>
          <p>
            Save Our Spends operates with <strong>zero proprietary backend servers or central databases</strong>.
            All computations, financial calculations, and debt simplification algorithms run exclusively in your browser.
            Your financial data is persisted strictly in <strong>Google Sheets spreadsheets located in your personal Google Drive</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Google Scopes Accessed &amp; Usage
          </h2>
          <p>We access Google APIs using least-privilege permissions:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Google Profile (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">userinfo.profile</code> &amp; <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">userinfo.email</code>):</strong> Used
              to identify your user avatar and name in group expense splits and associate expense rows to your personal tab (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Exp_&lt;email&gt;</code>).
            </li>
            <li>
              <strong>Google Drive File Access (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">drive.file</code>):</strong> Grants
              per-file access strictly limited to spreadsheets created by Save Our Spends or opened via the Google Drive Picker. We <strong>never</strong> have access to your general Google Drive files.
            </li>
          </ul>
        </section>

        {/* Limited Use Banner */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
            Save Our Spends&apos; use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold"
            >
              Google API Services User Data Policy
              <ExternalLink className="w-3 h-3" />
            </a>
            , including the Limited Use requirements.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Privacy Guarantees
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Zero Third-Party Sharing:</strong> We never sell, rent, or transfer your data to advertisers, brokers, or external entities.</li>
            <li><strong>No Ads &amp; No Tracking:</strong> The application does not serve ads or employ commercial tracking beacons.</li>
            <li><strong>No AI/ML Training:</strong> Your Google data is never used to train or fine-tune artificial intelligence or machine learning models.</li>
            <li><strong>Direct TLS Encryption:</strong> All API requests travel directly between your browser and Google servers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            4. Data Retention, Revocation &amp; Deletion
          </h2>
          <p>
            You hold total control over your data. You may delete spreadsheets at any time in Google Drive, or wipe local browser caches using browser site settings.
          </p>
          <p>
            To revoke Google OAuth access, visit your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 underline inline-flex items-center gap-1"
            >
              Google Account Permissions
              <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            5. Contact Information
          </h2>
          <p>
            For inquiries regarding privacy, please contact:
          </p>
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
        <a href="#terms" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          Terms of Service
        </a>{' '}
        &bull; Standalone HTML view:{' '}
        <a href="/privacy.html" className="hover:text-emerald-600 dark:hover:text-emerald-400">
          /privacy.html
        </a>
      </div>
    </div>
  );
}

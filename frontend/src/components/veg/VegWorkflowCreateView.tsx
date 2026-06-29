import { ChevronLeft, FilePlus } from "lucide-react";
import { FormInput, FormSelect, FormTextarea } from "../ui/FormField";
import { WF_TYPES } from "../../utils/veg";
import type { UseFormReturn } from "react-hook-form";
import type { VegWfForm } from "../../schemas/forms";

interface Props {
  formHook: UseFormReturn<VegWfForm>;
  onSubmit: (data: VegWfForm) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
}

export default function VegWorkflowCreateView({ formHook, onSubmit, onBack, isPending }: Props) {
  const { register: wfReg, handleSubmit: wfHandleSubmit } = formHook;

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to list
      </button>
      <h2 className="text-2xl font-bold text-slate-800">New VEG Workflow Request</h2>

      <form onSubmit={wfHandleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <FormInput label="Title *" registration={wfReg("title")} placeholder="e.g. RFP — BNP Paribas Colline Migration" />
          <FormInput label="Client *" registration={wfReg("client")} placeholder="e.g. BNP Paribas" />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Request Type" registration={wfReg("type")} options={WF_TYPES.map(t => ({ value: t, label: t.replace(/_/g, " ") }))} />
            <FormInput label="Owner ID" registration={wfReg("ownerId")} placeholder="User UUID (optional)" />
          </div>
          <FormTextarea label="Description" registration={wfReg("description")} rows={3} placeholder="Optional description or notes..." />

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
              <FilePlus className="w-4 h-4 inline mr-1" /> Create Request
            </button>
            <button onClick={onBack}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}

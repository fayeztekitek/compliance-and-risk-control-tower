import { ChevronLeft } from "lucide-react";
import { FormInput, FormSelect } from "../ui/FormField";
import { REGIONS, BUSINESS_LINES, DECISIONS } from "../../utils/veg";
import type { UseFormReturn } from "react-hook-form";
import type { VegDealForm } from "../../schemas/forms";

interface Props {
  mode: "create" | "edit";
  formHook: UseFormReturn<VegDealForm>;
  onSubmit: (data: VegDealForm) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
}

export default function VegCreateEditView({ mode, formHook, onSubmit, onBack, isPending }: Props) {
  const { register, handleSubmit, formState: { errors } } = formHook;

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-2xl font-bold text-slate-800">{mode === "create" ? "New VEG Deal" : "Edit VEG Deal"}</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="VEG ID" registration={register("vegId")} placeholder="e.g. 21-2023-001" />
            <FormInput label="VEG Date" registration={register("vegDate")} type="date" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Client" registration={register("client")} />
            <FormInput label="Business Owner" registration={register("businessOwner")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Investment Start Date" registration={register("invstStartDate")} type="date" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormSelect label="Region" registration={register("region")} options={REGIONS.map(r => ({ value: r, label: r }))} />
            <FormSelect label="Business Line" registration={register("businessLine")} options={BUSINESS_LINES.map(b => ({ value: b, label: b }))} />
            <FormSelect label="Committee Type" registration={register("committeeType")} options={[{ value: "Go n Go", label: "Go n Go" }, { value: "Bid n Bid", label: "Bid n Bid" }]} />
          </div>
          <FormInput label="Products" registration={register("products")} placeholder="e.g. Colline, Megara" />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Decision" registration={register("decision")} options={DECISIONS.map(d => ({ value: d, label: d }))} />
            <FormInput label="Year" registration={register("vegYear")} type="number" />
          </div>

          <h3 className="text-lg font-semibold text-slate-700 pt-2 border-t">Financial Breakdown (K€)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormInput label="TCV" registration={register("tcv")} type="number" />
            <FormInput label="IP + Maintenance" registration={register("ipMaintenance")} type="number" />
            <FormInput label="SaaS" registration={register("saas")} type="number" />
            <FormInput label="PS" registration={register("ps")} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Workload PS (man-days)" registration={register("wlPsMd")} type="number" />
            <FormInput label="Investment (man-days)" registration={register("wlInvestmentMd")} type="number" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
              {mode === "create" ? "Create Deal" : "Update Deal"}
            </button>
            <button onClick={onBack} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}

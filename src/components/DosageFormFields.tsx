import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';
import {
  DosageFormConfig,
  BOTTLE_SIZES,
  BOTTLE_TYPES,
  CAP_TYPES,
  STRIP_TYPES,
  TUBE_SIZES,
  TUBE_TYPES,
  VIAL_SIZES,
  AMPULE_SIZES,
  CARTON_SIZES,
  FIELD_LABELS,
} from '@/config/dosageFormConfig';

interface PackagingFieldsData {
  bottleSize?: string;
  bottleType?: string;
  capType?: string;
  inductionSeal?: boolean;
  measuringCup?: boolean;
  dropper?: boolean;
  stripType?: string;
  tubeSize?: string;
  tubeType?: string;
  vialSize?: string;
  ampuleSize?: string;
  needleIncluded?: boolean;
  outerCartonSize?: string;
  leafletRequired?: boolean;
}

interface DosageFormFieldsProps {
  config: DosageFormConfig;
  packagingData: PackagingFieldsData;
  onPackagingChange: (data: Partial<PackagingFieldsData>) => void;
}

export function DosageFormFields({ config, packagingData, onPackagingChange }: DosageFormFieldsProps) {
  const { showFields } = config;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-accent/30">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">প্যাকেজিং কনফিগারেশন</span>
        <Badge variant="secondary" className="text-xs">
          ডোজ ফর্ম অনুযায়ী
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Strip/Blister fields for solid forms */}
        {showFields.stripType && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.stripType}</Label>
            <Select 
              value={packagingData.stripType || ''} 
              onValueChange={(v) => onPackagingChange({ stripType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="স্ট্রিপ টাইপ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {STRIP_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bottle fields for liquid forms */}
        {showFields.bottleSize && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.bottleSize}</Label>
            <Select 
              value={packagingData.bottleSize || ''} 
              onValueChange={(v) => onPackagingChange({ bottleSize: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="সাইজ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {BOTTLE_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showFields.bottleType && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.bottleType}</Label>
            <Select 
              value={packagingData.bottleType || ''} 
              onValueChange={(v) => onPackagingChange({ bottleType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="বোতলের ধরন সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {BOTTLE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showFields.capType && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.capType}</Label>
            <Select 
              value={packagingData.capType || ''} 
              onValueChange={(v) => onPackagingChange({ capType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ক্যাপের ধরন সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {CAP_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tube fields for semi-solid forms */}
        {showFields.tubeSize && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.tubeSize}</Label>
            <Select 
              value={packagingData.tubeSize || ''} 
              onValueChange={(v) => onPackagingChange({ tubeSize: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="টিউব সাইজ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {TUBE_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showFields.tubeType && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.tubeType}</Label>
            <Select 
              value={packagingData.tubeType || ''} 
              onValueChange={(v) => onPackagingChange({ tubeType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="টিউব টাইপ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {TUBE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Vial/Ampule fields for injectables */}
        {showFields.vialSize && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.vialSize}</Label>
            <Select 
              value={packagingData.vialSize || ''} 
              onValueChange={(v) => onPackagingChange({ vialSize: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="ভায়াল সাইজ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {VIAL_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showFields.ampuleSize && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.ampuleSize}</Label>
            <Select 
              value={packagingData.ampuleSize || ''} 
              onValueChange={(v) => onPackagingChange({ ampuleSize: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="অ্যাম্পুল সাইজ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {AMPULE_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Outer carton size - common for all */}
        {showFields.outerCartonSize && (
          <div className="space-y-2">
            <Label>{FIELD_LABELS.outerCartonSize}</Label>
            <Select 
              value={packagingData.outerCartonSize || ''} 
              onValueChange={(v) => onPackagingChange({ outerCartonSize: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="কার্টন সাইজ সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                {CARTON_SIZES.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Toggle switches */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
        {showFields.inductionSeal && (
          <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border bg-background">
            <Label htmlFor="inductionSeal" className="text-sm cursor-pointer">
              {FIELD_LABELS.inductionSeal}
            </Label>
            <Switch
              id="inductionSeal"
              checked={packagingData.inductionSeal || false}
              onCheckedChange={(checked) => onPackagingChange({ inductionSeal: checked })}
            />
          </div>
        )}

        {showFields.measuringCup && (
          <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border bg-background">
            <Label htmlFor="measuringCup" className="text-sm cursor-pointer">
              {FIELD_LABELS.measuringCup}
            </Label>
            <Switch
              id="measuringCup"
              checked={packagingData.measuringCup || false}
              onCheckedChange={(checked) => onPackagingChange({ measuringCup: checked })}
            />
          </div>
        )}

        {showFields.dropper && (
          <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border bg-background">
            <Label htmlFor="dropper" className="text-sm cursor-pointer">
              {FIELD_LABELS.dropper}
            </Label>
            <Switch
              id="dropper"
              checked={packagingData.dropper || false}
              onCheckedChange={(checked) => onPackagingChange({ dropper: checked })}
            />
          </div>
        )}

        {showFields.needleIncluded && (
          <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border bg-background">
            <Label htmlFor="needleIncluded" className="text-sm cursor-pointer">
              {FIELD_LABELS.needleIncluded}
            </Label>
            <Switch
              id="needleIncluded"
              checked={packagingData.needleIncluded || false}
              onCheckedChange={(checked) => onPackagingChange({ needleIncluded: checked })}
            />
          </div>
        )}

        {showFields.leafletRequired && (
          <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border bg-background">
            <Label htmlFor="leafletRequired" className="text-sm cursor-pointer">
              {FIELD_LABELS.leafletRequired}
            </Label>
            <Switch
              id="leafletRequired"
              checked={packagingData.leafletRequired ?? true}
              onCheckedChange={(checked) => onPackagingChange({ leafletRequired: checked })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Warning component when unit is locked
export function UnitLockedWarning({ dosageForm }: { dosageForm: string }) {
  return (
    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
      <AlertTriangle className="h-3 w-3" />
      <span>{dosageForm} এর জন্য ইউনিট নির্ধারিত</span>
    </div>
  );
}

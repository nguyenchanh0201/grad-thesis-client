"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isValidEmail } from "@/lib/form/email";
import { useBookingStore } from "@/lib/store/booking";
import { useCountryCodes } from "@/hooks/use-country-code";
import { FieldWrap } from "./field-wrap";
import { CountryCodeSelect } from "../shared/country-search";
import { RecipientInfo } from "@/schemas/booking";

export type RecipientFormHandle = {
  triggerValidation: () => Promise<boolean>;
};

const RECIPIENT_FIELD_KEYS: (keyof RecipientInfo)[] = [
  "fullName",
  "email",
  "phoneCountryCode",
  "phoneNumber",
  "idPassport",
];

function normalizeRecipient(
  input: Partial<RecipientInfo> | RecipientInfo,
): RecipientInfo {
  return {
    fullName: input.fullName ?? "",
    email: input.email ?? "",
    phoneCountryCode: input.phoneCountryCode ?? "+84",
    phoneNumber: input.phoneNumber ?? "",
    idPassport: input.idPassport ?? "",
  };
}

function isSameRecipient(
  left: Partial<RecipientInfo> | RecipientInfo,
  right: Partial<RecipientInfo> | RecipientInfo,
) {
  const a = normalizeRecipient(left);
  const b = normalizeRecipient(right);
  return RECIPIENT_FIELD_KEYS.every((field) => a[field] === b[field]);
}

export const RecipientInfoForm = forwardRef<RecipientFormHandle, object>(
  function RecipientInfoForm(_, ref) {
    const { recipient, updateRecipient } = useBookingStore();
    const { data: countryCodes = [] } = useCountryCodes();

    const {
      register,
      control,
      getValues,
      reset,
      trigger,
      formState: { errors },
    } = useForm<RecipientInfo>({
      mode: "onBlur",
      defaultValues: recipient,
    });

    const formValues = useWatch({ control });
    useEffect(() => {
      const currentValues = getValues();
      if (!isSameRecipient(currentValues, recipient)) {
        reset(recipient);
      }
    }, [getValues, recipient, reset]);

    useEffect(() => {
      if (!formValues) return;
      if (!isSameRecipient(formValues as Partial<RecipientInfo>, recipient)) {
        updateRecipient(formValues as Partial<RecipientInfo>);
      }
    }, [formValues, recipient, updateRecipient]);

    useImperativeHandle(ref, () => ({
      triggerValidation: () => trigger(),
    }));

    const errClass = (field: keyof RecipientInfo) =>
      errors[field]
        ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
        : "";

    return (
      <div className="space-y-5">
        <h2 className="text-base font-semibold text-foreground">
          Representative ticket recipient information
        </h2>

        <div className="space-y-4">
          {/* Full Name */}
          <FieldWrap
            htmlFor="recipient-fullName"
            label="Full Name"
            required
            error={errors.fullName?.message}
          >
            <Input
              id="recipient-fullName"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              className={errClass("fullName")}
              {...register("fullName", { required: "Full name is required" })}
            />
          </FieldWrap>

          {/* Email */}
          <FieldWrap
            htmlFor="recipient-email"
            label="Email"
            required
            error={errors.email?.message}
          >
            <Input
              id="recipient-email"
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              className={errClass("email")}
              {...register("email", {
                required: "Email is required",
                validate: (v) =>
                  isValidEmail(v) || "Enter a valid email address",
              })}
            />
          </FieldWrap>

          {/* Phone Number */}
          <FieldWrap
            htmlFor="recipient-phoneNumber"
            label="Phone Number"
            required
            error={errors.phoneNumber?.message}
          >
            <div className="flex gap-2">
              <Controller
                name="phoneCountryCode"
                control={control}
                render={({ field }) => (
                  <CountryCodeSelect
                    value={field.value}
                    onChange={field.onChange}
                    countries={countryCodes}
                  />
                )}
              />
              <Input
                id="recipient-phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                autoComplete="tel-national"
                className={cn("flex-1", errClass("phoneNumber"))}
                {...register("phoneNumber", {
                  required: "Phone number is required",
                })}
              />
            </div>
          </FieldWrap>

          {/* ID / Passport */}
          <FieldWrap htmlFor="recipient-idPassport" label="ID / Passport">
            <Input
              id="recipient-idPassport"
              type="text"
              placeholder="Enter personal identification number / Passport"
              autoComplete="off"
              {...register("idPassport")}
            />
          </FieldWrap>
        </div>

        {/* Legal Notice */}
        <div className="rounded-sm bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-medium">Lưu ý pháp lý / Legal Notice</p>
          <p>
            Theo Nghị định số 137/2020/NĐ-CP và các quy định hiện hành về tổ
            chức biểu diễn nghệ thuật, người mua vé có trách nhiệm cung cấp
            thông tin chính xác. Vé đã mua không được hoàn trả dưới mọi hình
            thức, trừ trường hợp sự kiện bị hủy bởi ban tổ chức.
          </p>
          <p className="mt-1">
            In accordance with Decree No. 137/2020/ND-CP and current regulations
            on artistic performance organization, ticket purchasers are
            responsible for providing accurate information. Purchased tickets
            are non-refundable except in the event of cancellation by the
            organizer.
          </p>
        </div>
      </div>
    );
  },
);

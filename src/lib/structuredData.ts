// Real business policy data for schema.org Product/Offer structured data.
// Sourced from /return-policy (24h window, damaged/incorrect/defective items only)
// and the live delivery-charges API (cost) — do not fabricate values here.

export function getMerchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "BD",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 1,
  };
}

interface DeliveryCharges {
  inside_dhaka: string;
  outside_dhaka: string;
}

export function getShippingDetails(charges: DeliveryCharges | null) {
  const deliveryTime = {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: 0,
      maxValue: 1,
      unitCode: "DAY",
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 3,
      maxValue: 5,
      unitCode: "DAY",
    },
  };

  if (!charges) {
    return {
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
      deliveryTime,
    };
  }

  return [
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: charges.inside_dhaka, currency: "BDT" },
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: "BD",
        addressRegion: "Dhaka",
      },
      deliveryTime,
    },
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: charges.outside_dhaka, currency: "BDT" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
      deliveryTime,
    },
  ];
}

interface FAQItem {
  question_bn: string;
  question_en: string;
  answer_bn: string;
  answer_en: string;
}

export function getFAQPageSchema(faqs: FAQItem[], isBn: boolean) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: isBn ? faq.question_bn : faq.question_en,
      acceptedAnswer: {
        "@type": "Answer",
        text: isBn ? faq.answer_bn : faq.answer_en,
      },
    })),
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function getBreadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface SiteSettingForSchema {
  company_name_bn: string;
  company_name_en: string;
  contact_phone: string;
  contact_email: string;
  address_bn: string;
  address_en: string;
  logo: string | null;
}

export function getOrganizationSchema(settings: SiteSettingForSchema, isBn: boolean, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: isBn ? settings.company_name_bn : settings.company_name_en,
    url: siteUrl,
    ...(settings.logo ? { logo: settings.logo } : {}),
    ...(settings.contact_phone || settings.contact_email
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
            ...(settings.contact_email ? { email: settings.contact_email } : {}),
            contactType: "customer service",
          },
        }
      : {}),
    ...(settings.address_bn || settings.address_en
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: isBn ? settings.address_bn : settings.address_en,
            addressCountry: "BD",
          },
        }
      : {}),
  };
}

export function getCollectionPageSchema(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
  };
}

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

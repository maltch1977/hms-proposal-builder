import { Page, View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "./pdf-styles";

interface CoverPagePdfProps {
  title: string;
  clientName: string;
  clientAddress: string;
  projectLabel: string;
  coverTemplate: "photo" | "no_photo";
  coverPhotoUrl?: string;
  logoUrl?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

export function CoverPagePdf({
  title,
  clientName,
  clientAddress,
  projectLabel,
  coverTemplate,
  coverPhotoUrl,
  logoUrl,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyWebsite,
}: CoverPagePdfProps) {
  if (coverTemplate === "photo" && coverPhotoUrl) {
    return (
      <Page
        size="LETTER"
        style={{
          paddingHorizontal: 72,
          paddingVertical: 72,
          justifyContent: "space-between",
        }}
      >
        <View>
          {logoUrl && (
            <Image
              src={logoUrl}
              style={{
                width: 144,
                height: 144,
                objectFit: "contain",
                marginBottom: 36,
              }}
            />
          )}
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Helvetica-Bold",
              color: COLORS.gold,
              letterSpacing: 3,
              marginBottom: 8,
            }}
          >
            {projectLabel || "RESPONSE TO RFP"}
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
              marginBottom: 16,
            }}
          >
            {title}
          </Text>
          <View
            style={{
              width: 60,
              borderBottomWidth: 3,
              borderBottomColor: COLORS.gold,
              marginBottom: 20,
            }}
          />
          <Text style={{ fontSize: 14, color: COLORS.bodyText }}>
            Prepared for: {clientName}
          </Text>
          {clientAddress && (
            <Text
              style={{
                fontSize: 10,
                color: COLORS.darkGray,
                marginTop: 4,
              }}
            >
              {clientAddress}
            </Text>
          )}
          <Image
            src={coverPhotoUrl}
            style={{
              width: "100%",
              maxHeight: 320,
              objectFit: "cover",
              marginTop: 24,
              borderRadius: 4,
            }}
          />
        </View>

        <View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: COLORS.mediumGray,
              paddingTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Helvetica-Bold",
                color: COLORS.navy,
              }}
            >
              {companyName || "HMS Commercial Service, Inc."}
            </Text>
            {companyAddress && (
              <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 2 }}>
                {companyAddress}
              </Text>
            )}
            {companyPhone && (
              <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
                {companyPhone}
              </Text>
            )}
            {companyEmail && (
              <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
                {companyEmail}
              </Text>
            )}
            {companyWebsite && (
              <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
                {companyWebsite}
              </Text>
            )}
          </View>
        </View>
      </Page>
    );
  }

  // Clean typography template (no photo)
  return (
    <Page
      size="LETTER"
      style={{
        paddingHorizontal: 72,
        paddingVertical: 72,
        justifyContent: "space-between",
      }}
    >
      <View>
        {logoUrl && (
          <Image
            src={logoUrl}
            style={{
              width: 72,
              height: 72,
              objectFit: "contain",
              marginBottom: 36,
            }}
          />
        )}
        <Text
          style={{
            fontSize: 10,
            fontFamily: "Helvetica-Bold",
            color: COLORS.gold,
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          {projectLabel || "RESPONSE TO RFP"}
        </Text>
        <Text
          style={{
            fontSize: 30,
            fontFamily: "Helvetica-Bold",
            color: COLORS.navy,
            marginBottom: 16,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            width: 60,
            borderBottomWidth: 3,
            borderBottomColor: COLORS.gold,
            marginBottom: 20,
          }}
        />
        <Text style={{ fontSize: 14, color: COLORS.bodyText }}>
          Prepared for: {clientName}
        </Text>
        {clientAddress && (
          <Text
            style={{
              fontSize: 10,
              color: COLORS.darkGray,
              marginTop: 4,
            }}
          >
            {clientAddress}
          </Text>
        )}
      </View>

      <View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.mediumGray,
            paddingTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Helvetica-Bold",
              color: COLORS.navy,
            }}
          >
            {companyName || "HMS Commercial Service, Inc."}
          </Text>
          {companyAddress && (
            <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 2 }}>
              {companyAddress}
            </Text>
          )}
          {companyPhone && (
            <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
              {companyPhone}
            </Text>
          )}
          {companyEmail && (
            <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
              {companyEmail}
            </Text>
          )}
          {companyWebsite && (
            <Text style={{ fontSize: 9, color: COLORS.darkGray, marginTop: 1 }}>
              {companyWebsite}
            </Text>
          )}
        </View>
      </View>
    </Page>
  );
}

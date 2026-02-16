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
      <Page size="LETTER" style={{ position: "relative" }}>
        {/* Background photo */}
        <Image
          src={coverPhotoUrl}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Dark overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(27, 54, 93, 0.75)",
          }}
        />
        {/* Content */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 72,
            position: "relative",
          }}
        >
          {logoUrl && (
            <Image
              src={logoUrl}
              style={{
                width: 80,
                height: 80,
                objectFit: "contain",
                marginBottom: 24,
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
              fontSize: 28,
              fontFamily: "Helvetica-Bold",
              color: COLORS.white,
              marginBottom: 12,
            }}
          >
            {title}
          </Text>
          <View
            style={{
              width: 60,
              borderBottomWidth: 3,
              borderBottomColor: COLORS.gold,
              marginBottom: 16,
            }}
          />
          <Text style={{ fontSize: 14, color: COLORS.white }}>
            {clientName}
          </Text>
          {clientAddress && (
            <Text
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.8)",
                marginTop: 4,
              }}
            >
              {clientAddress}
            </Text>
          )}
        </View>
        {/* Bottom company info */}
        <View
          style={{
            position: "absolute",
            bottom: 36,
            left: 72,
            right: 72,
          }}
        >
          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>
            {companyName || "HMS Commercial Service, Inc."}
          </Text>
          {(companyAddress || companyPhone) && (
            <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
              {[companyAddress, companyPhone, companyEmail].filter(Boolean).join("  |  ")}
            </Text>
          )}
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

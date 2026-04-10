import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const ContactEmail = ({ name, email, message }) => {
  return (
    <Html>
      <Head />
      <Preview>Tin nhắn liên hệ mới từ {name}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Bạn có liên hệ mới từ KeyHub</Heading>
          <Text style={styles.label}>Người gửi</Text>
          <Text style={styles.value}>{name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>

          <Hr style={styles.hr} />

          <Section style={styles.messageBox}>
            <Text style={styles.label}>Nội dung</Text>
            <Text style={styles.message}>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: "#f6f7f9",
    fontFamily: "Arial, sans-serif",
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "28px",
    maxWidth: "560px",
  },
  heading: {
    color: "#111827",
    fontSize: "22px",
    margin: "0 0 20px",
  },
  label: {
    color: "#6b7280",
    fontSize: "12px",
    margin: "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  value: {
    color: "#111827",
    fontSize: "15px",
    margin: "0 0 14px",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "18px 0",
  },
  messageBox: {
    backgroundColor: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "10px",
    padding: "14px",
  },
  message: {
    color: "#1f2937",
    fontSize: "15px",
    margin: "0",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
  },
};

export default ContactEmail;

import WidgetKit
import SwiftUI

// MARK: - Data Model

struct FokusData: Codable {
    var text: String
    var category: String
    var lastUpdated: String

    static var placeholder: FokusData {
        FokusData(
            text: "Set your daily focus",
            category: "focus",
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        )
    }
}

// MARK: - Timeline Entry

struct FokusEntry: TimelineEntry {
    let date: Date
    let data: FokusData
}

// MARK: - Provider

struct FokusProvider: TimelineProvider {
    func placeholder(in context: Context) -> FokusEntry {
        FokusEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (FokusEntry) -> Void) {
        completion(FokusEntry(date: Date(), data: loadData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FokusEntry>) -> Void) {
        let entry = FokusEntry(date: Date(), data: loadData())
        let refreshDate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func loadData() -> FokusData {
        guard
            let defaults = UserDefaults(suiteName: AppGroupID),
            let jsonString = defaults.string(forKey: "fokusData"),
            let jsonData = jsonString.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(FokusData.self, from: jsonData)
        else {
            return .placeholder
        }
        return decoded
    }
}

private let AppGroupID = Bundle.main.infoDictionary?["FokusAppGroupID"] as? String
    ?? "group.com.replit.fokus"

// MARK: - Color Helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:  (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:  (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:  (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Category Helpers

private func categoryIcon(_ category: String) -> String {
    switch category {
    case "quote":    return "quote.bubble.fill"
    case "goal":     return "flag.fill"
    case "reminder": return "alarm.fill"
    default:         return "bolt.fill"
    }
}

private func categoryLabel(_ category: String) -> String {
    switch category {
    case "quote":    return "QUOTE"
    case "goal":     return "GOAL"
    case "reminder": return "REMINDER"
    default:         return "FOCUS"
    }
}

// MARK: - Widget Views

struct FokusSmallView: View {
    let data: FokusData

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "4F46E5"), Color(hex: "3730A3")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 0) {
                Image(systemName: categoryIcon(data.category))
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white.opacity(0.85))

                Spacer()

                Text(data.text)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(4)
                    .minimumScaleFactor(0.8)
                    .fixedSize(horizontal: false, vertical: false)

                Spacer().frame(height: 6)

                Text("fokus")
                    .font(.system(size: 9, weight: .medium, design: .rounded))
                    .foregroundColor(.white.opacity(0.5))
                    .tracking(1.5)
            }
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .containerBackground(for: .widget) {
            Color(hex: "4F46E5")
        }
    }
}

struct FokusMediumView: View {
    let data: FokusData

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "4F46E5"), Color(hex: "3730A3")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(alignment: .center, spacing: 0) {
                // Left column
                VStack(alignment: .center, spacing: 6) {
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.15))
                            .frame(width: 46, height: 46)
                        Image(systemName: categoryIcon(data.category))
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.white)
                    }

                    Text(categoryLabel(data.category))
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .foregroundColor(.white.opacity(0.65))
                        .tracking(1.5)
                        .multilineTextAlignment(.center)
                }
                .frame(width: 70)

                // Divider
                Rectangle()
                    .fill(.white.opacity(0.2))
                    .frame(width: 1)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 12)

                // Right column
                VStack(alignment: .leading, spacing: 0) {
                    Text(data.text)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .lineLimit(5)
                        .fixedSize(horizontal: false, vertical: false)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Spacer()

                    HStack {
                        Text("fokus")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.45))
                            .tracking(1)

                        Spacer()

                        if let date = parsedDate(data.lastUpdated) {
                            Text(date, style: .date)
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.45))
                        }
                    }
                }
                .padding(.trailing, 14)
                .padding(.vertical, 14)
            }
        }
        .containerBackground(for: .widget) {
            Color(hex: "4F46E5")
        }
    }
}

struct FokusLargeView: View {
    let data: FokusData

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "4F46E5"), Color(hex: "1E1B4B")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 0) {
                // Header
                HStack(alignment: .center) {
                    Text("fokus")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundColor(.white.opacity(0.75))
                        .tracking(1)

                    Spacer()

                    HStack(spacing: 5) {
                        Image(systemName: categoryIcon(data.category))
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundColor(.white.opacity(0.65))
                        Text(categoryLabel(data.category))
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white.opacity(0.65))
                            .tracking(1.5)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(.white.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 7))
                }

                Spacer()

                Text(data.text)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(7)
                    .fixedSize(horizontal: false, vertical: false)

                Spacer()

                HStack {
                    if let date = parsedDate(data.lastUpdated) {
                        Text(date, format: .dateTime.weekday(.wide).month().day())
                            .font(.system(size: 12))
                            .foregroundColor(.white.opacity(0.5))
                    }
                    Spacer()
                    Text("Tap to edit")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.4))
                }
            }
            .padding(20)
        }
        .containerBackground(for: .widget) {
            Color(hex: "4F46E5")
        }
    }
}

private func parsedDate(_ iso: String) -> Date? {
    ISO8601DateFormatter().date(from: iso)
}

// MARK: - Entry View

struct FokusWidgetEntryView: View {
    var entry: FokusProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            FokusSmallView(data: entry.data)
        case .systemMedium:
            FokusMediumView(data: entry.data)
        case .systemLarge:
            FokusLargeView(data: entry.data)
        default:
            FokusMediumView(data: entry.data)
        }
    }
}

// MARK: - Widget Declaration

struct FokusWidget: Widget {
    let kind: String = "FokusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FokusProvider()) { entry in
            FokusWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Fokus")
        .description("Your daily focus, always visible.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Previews

#Preview(as: .systemMedium) {
    FokusWidget()
} timeline: {
    FokusEntry(
        date: Date(),
        data: FokusData(
            text: "Ship the MVP by end of day",
            category: "focus",
            lastUpdated: ISO8601DateFormatter().string(from: Date())
        )
    )
}

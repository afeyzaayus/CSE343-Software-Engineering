/// Represents the possible states of a support request.
enum TicketStatus { pending, inProgress, resolved, cancelled }

/// Represents a support ticket or maintenance request submitted by a resident.
class RequestTicket {
  final int id;
  final String title;
  final String content;
  final String category;
  final TicketStatus status;
  final DateTime createdAt;

  RequestTicket({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.status,
    required this.createdAt,
  });

  /// Factory constructor to create a [RequestTicket] from a JSON map.
  ///
  /// Includes safety checks for date parsing and status mapping.
  factory RequestTicket.fromJson(Map<String, dynamic> json) {
    // Handle date keys safely (support both camelCase and snake_case)
    final dateStr =
        json['createdAt']?.toString() ?? json['created_at']?.toString();

    return RequestTicket(
      id: int.tryParse(json['id'].toString()) ?? 0,
      title: json['title'] ?? '',
      content: json['content'] ?? json['description'] ?? '',
      category: json['category'] ?? 'OTHER',
      status: _parseStatus(json['status']),
      createdAt: DateTime.tryParse(dateStr ?? '') ?? DateTime.now(),
    );
  }

  /// Helper method to map string values to [TicketStatus] enum safely.
  /// Handles case-insensitivity.
  static TicketStatus _parseStatus(String? status) {
    if (status == null) return TicketStatus.pending;

    switch (status.toUpperCase()) {
      case 'PENDING':
        return TicketStatus.pending;
      case 'IN_PROGRESS':
      case 'INPROGRESS': // Handling potential backend inconsistency
        return TicketStatus.inProgress;
      case 'RESOLVED':
        return TicketStatus.resolved;
      case 'CANCELLED':
      case 'REJECTED':
        return TicketStatus.cancelled;
      default:
        return TicketStatus.pending;
    }
  }

  /// Returns a user-friendly display string for the status.
  String get statusText {
    switch (status) {
      case TicketStatus.pending:
        return 'Pending';
      case TicketStatus.inProgress:
        return 'In Progress';
      case TicketStatus.resolved:
        return 'Resolved';
      case TicketStatus.cancelled:
        return 'Cancelled';
    }
  }
}

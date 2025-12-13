enum TicketStatus { pending, inProgress, resolved, cancelled }

class RequestTicket {
  final int id; // Backend ID'yi muhtemelen int dönüyor, string gelirse değiştiririz
  final String title;
  final String content; // Backend 'content' olarak gönderiyor
  final String category; // 'MAINTENANCE', 'COMPLAINT' vb.
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

  factory RequestTicket.fromJson(Map<String, dynamic> json) {
    return RequestTicket(
      id: json['id'],
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      category: json['category'] ?? 'OTHER',
      status: _parseStatus(json['status']),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }

  static TicketStatus _parseStatus(String? status) {
    switch (status) {
      case 'PENDING':
        return TicketStatus.pending;
      case 'IN_PROGRESS':
        return TicketStatus.inProgress;
      case 'RESOLVED':
        return TicketStatus.resolved;
      case 'CANCELLED':
        return TicketStatus.cancelled;
      default:
        return TicketStatus.pending;
    }
  }
  
  // UI'da göstermek için helper (İngilizce)
  String get statusText {
    switch (status) {
      case TicketStatus.pending: return 'Pending';
      case TicketStatus.inProgress: return 'In Progress';
      case TicketStatus.resolved: return 'Resolved';
      case TicketStatus.cancelled: return 'Cancelled';
    }
  }
}
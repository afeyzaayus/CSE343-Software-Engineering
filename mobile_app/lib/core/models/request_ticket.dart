enum TicketStatus { open, inProgress, resolved, closed }

class RequestTicket {
  final String id;
  final String title;
  final String description;
  final TicketStatus status;
  final DateTime createdAt;
  RequestTicket({required this.id, required this.title, required this.description, required this.status, required this.createdAt});

  factory RequestTicket.fromJson(Map<String,dynamic> j) => RequestTicket(
    id: j['id'], title: j['title'], description: j['description'],
    status: switch (j['status']) {
      'OPEN' => TicketStatus.open,
      'IN_PROGRESS' => TicketStatus.inProgress,
      'RESOLVED' => TicketStatus.resolved,
      'CLOSED' => TicketStatus.closed,
      _ => TicketStatus.open
    },
    createdAt: DateTime.parse(j['createdAt']),
  );
}

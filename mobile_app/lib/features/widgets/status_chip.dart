import 'package:flutter/material.dart';
import '../../core/models/request_ticket.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});
  final TicketStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      TicketStatus.open => ('Open', Colors.orange),
      TicketStatus.inProgress => ('In Progress', Colors.blue),
      TicketStatus.resolved => ('Resolved', Colors.green),
      TicketStatus.closed => ('Closed', Colors.grey),
    };
    return Chip(label: Text(label), backgroundColor: color.withOpacity(.15));
  }
}

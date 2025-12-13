import 'package:flutter/material.dart';
import '../../core/models/request_ticket.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});
  final TicketStatus status;

  @override
  Widget build(BuildContext context) {
    // Yeni Enum: pending, inProgress, resolved, cancelled
    final (label, color) = switch (status) {
      TicketStatus.pending => ('Pending', Colors.orange),
      TicketStatus.inProgress => ('In Progress', Colors.blue),
      TicketStatus.resolved => ('Resolved', Colors.green),
      TicketStatus.cancelled => ('Cancelled', Colors.grey),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color, // Metin rengi de ikon rengiyle aynı olsun
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
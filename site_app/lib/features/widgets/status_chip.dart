import 'package:flutter/material.dart';
import '../../core/models/request_ticket.dart';

/// A reusable widget to display the status of a ticket (e.g., Pending, Resolved)
/// with a color-coded background and border.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});
  final TicketStatus status;

  @override
  Widget build(BuildContext context) {
    // Determine the label text and color based on the status enum
    final (label, color) = switch (status) {
      TicketStatus.pending => ('BEKLEMEDE', Colors.orange),
      TicketStatus.inProgress => ('İŞLEMDE', Colors.blue),
      TicketStatus.resolved => ('ÇÖZÜLDÜ', Colors.green),
      TicketStatus.cancelled => ('İPTAL EDİLDİ', Colors.grey),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: color.withValues(alpha: 0.5),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
}
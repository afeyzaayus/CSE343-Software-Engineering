import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/auth/auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _pass = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authStateProvider);
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _form,
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('Log In', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 16),
                TextFormField(controller: _email, decoration: const InputDecoration(labelText: 'Email'), validator: (v) => (v==null||v.isEmpty)?'Required':null),
                const SizedBox(height: 12),
                TextFormField(controller: _pass, obscureText: true, decoration: const InputDecoration(labelText: 'Password'), validator: (v) => (v==null||v.isEmpty)?'Required':null),
                if (auth.error != null) Padding(padding: const EdgeInsets.only(top:8), child: Text(auth.error!, style: const TextStyle(color: Colors.red))),
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: FilledButton(
                  onPressed: () async {
                    if (_form.currentState!.validate()) {
                      await ref.read(authStateProvider.notifier).login(_email.text.trim(), _pass.text);
                      if (mounted && ref.read(authStateProvider).isLoggedIn) context.go('/home');
                    }
                  },
                  child: const Text('Log In'),
                )),
                TextButton(onPressed: () => context.push('/signup'), child: const Text('Sign Up'))
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
